import { networks, Psbt, Transaction } from "bitcoinjs-lib";
import reverseBuffer from "buffer-reverse";

import { INSTANT_BUY_SELLER_INPUT_INDEX } from "../config";
import type { Network } from "../config/types";
import { MINIMUM_AMOUNT_IN_SATS } from "../constants";
import { FeeEstimator } from "../fee/FeeEstimator";
import type { InputsToSign } from "../inscription/types";
import { BaseDatasource } from "../modules/BaseDatasource";
import { JsonRpcDatasource } from "../modules/JsonRpcDatasource";
import {
  convertSatoshisToBTC,
  generateTxUniqueIdentifier,
  getNetwork,
  toXOnly,
} from "../utils";
import { InputType, processInput } from "./helper";
import type { Output, UTXOLimited } from "./types";

export interface PSBTBuilderOptions {
  address: string;
  changeAddress?: string;
  feeRate: number;
  network: Network;
  outputs: Output[];
  publicKey: string;
  autoAdjustment?: boolean;
  instantTradeMode?: boolean;
  datasource?: BaseDatasource;
}

export type InjectableInput = {
  injectionIndex: number;
  txInput: unknown;
  sats: number;
  standardInput: InputType;
};

export interface InjectableOutput {
  injectionIndex: number;
  txOutput: unknown;
  sats: number;
  standardOutput: unknown;
}

export class PSBTBuilder extends FeeEstimator {
  protected address: string;

  protected changeAddress?: string;

  protected changeAmount = 0;

  protected datasource: BaseDatasource;

  protected injectableInputs: InjectableInput[] = [];

  protected injectableOutputs: InjectableOutput[] = [];

  protected inputAmount = 0;

  protected inputs: InputType[] = [];

  protected outputAmount = 0;

  protected outputs: Output[] = [];

  protected psbt: Psbt;

  protected publicKey: string;

  protected rbf = true;

  protected utxos: UTXOLimited[] = [];

  protected usedUTXOs: string[] = [];

  private autoAdjustment: boolean;

  private instantTradeMode: boolean;

  private nativeNetwork: networks.Network;

  private noMoreUTXOS = false;

  get data() {
    return {
      fee: this.fee,
      virtualSize: this.virtualSize,
      weight: this.weight,
      changeAmount: this.changeAmount,
      inputAmount: this.inputAmount,
      outputAmount: this.outputAmount,
    };
  }

  constructor({
    address,
    changeAddress,
    datasource,
    feeRate,
    network,
    publicKey,
    outputs,
    autoAdjustment = true,
    instantTradeMode = false,
  }: PSBTBuilderOptions) {
    super({
      feeRate,
      network,
    });
    this.address = address;
    this.changeAddress = changeAddress;
    this.datasource =
      datasource || new JsonRpcDatasource({ network: this.network });
    this.outputs = outputs;
    this.nativeNetwork = getNetwork(network);
    this.publicKey = publicKey;

    this.autoAdjustment = autoAdjustment;
    this.instantTradeMode = instantTradeMode;

    this.psbt = new Psbt({ network: this.nativeNetwork });
  }

  toPSBT() {
    return this.psbt;
  }

  toHex() {
    return this.psbt.toHex();
  }

  toBase64() {
    return this.psbt.toBase64();
  }

  enableRBF() {
    this.rbf = true;
    this.addInputs();
  }

  disableRBF() {
    this.rbf = false;
    this.addInputs();
  }

  get xKey() {
    return toXOnly(Buffer.from(this.publicKey, "hex")).toString("hex");
  }

  get inputsToSign() {
    const instantTradeSellerFlow =
      this.instantTradeMode && !this.autoAdjustment;
    return this.psbt.txInputs.reduce(
      (acc, _, index) => {
        if (
          !this.instantTradeMode ||
          (this.instantTradeMode && index !== INSTANT_BUY_SELLER_INPUT_INDEX)
        ) {
          acc.signingIndexes = acc.signingIndexes.concat(index);
        }

        if (instantTradeSellerFlow) {
          acc.sigHash =
            // eslint-disable-next-line no-bitwise
            Transaction.SIGHASH_SINGLE | Transaction.SIGHASH_ANYONECANPAY;
        }

        return acc;
      },
      {
        address: this.address,
        signingIndexes: [],
      } as InputsToSign,
    );
  }

  protected initPSBT() {
    this.psbt = new Psbt({ network: getNetwork(this.network) }); // create new PSBT
    this.psbt.setMaximumFeeRate(this.feeRate);
  }

  protected getInputSequence() {
    return this.rbf ? 0xfffffffd : 0xffffffff;
  }

  private injectInput(injectable: InjectableInput) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.psbt.data.globalMap.unsignedTx as any).tx.ins[
      injectable.injectionIndex
    ] = injectable.txInput;
    this.psbt.data.inputs[injectable.injectionIndex] = injectable.standardInput;
  }

  private injectOutput(injectable: InjectableOutput) {
    let potentialIndex = injectable.injectionIndex;

    do {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isReserved = !!(this.psbt.data.globalMap.unsignedTx as any).tx.outs[
        potentialIndex
      ];
      if (!isReserved) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.psbt.data.globalMap.unsignedTx as any).tx.outs[potentialIndex] =
          injectable.txOutput;
        this.psbt.data.outputs[potentialIndex] =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          injectable.standardOutput as any;
        break;
      }
      potentialIndex += 1;
    } while (potentialIndex);
  }

  private addInputs() {
    const reservedIndexes = this.injectableInputs.map(
      (input) => input.injectionIndex,
    );
    const injectedIndexes: number[] = [];

    this.inputs.forEach((input, inputIndex) => {
      const indexReserved = reservedIndexes.includes(inputIndex);
      if (indexReserved) {
        const injectable = this.injectableInputs.find(
          (o) => o.injectionIndex === inputIndex,
        )!;
        this.injectInput(injectable);
        injectedIndexes.push(injectable.injectionIndex);
      }

      const existingInputHashes = this.psbt.txInputs.map((txInput) => {
        const hash = reverseBuffer(txInput.hash) as Buffer;
        return generateTxUniqueIdentifier(hash.toString("hex"), txInput.index);
      });

      if (
        existingInputHashes.includes(
          generateTxUniqueIdentifier(input.hash, input.index),
        )
      ) {
        return;
      }

      this.psbt.addInput(input);
      this.psbt.setInputSequence(
        indexReserved ? inputIndex + 1 : inputIndex,
        this.getInputSequence(),
      );
    });

    this.injectableInputs.forEach((injectable) => {
      if (injectedIndexes.includes(injectable.injectionIndex)) {
        return;
      }
      this.injectInput(injectable);
      injectedIndexes.push(injectable.injectionIndex);
    });
  }

  private validateOutputAmount() {
    if (this.outputAmount < MINIMUM_AMOUNT_IN_SATS) {
      throw new Error(
        `Output amount too low. Minimum output amount needs to be ${MINIMUM_AMOUNT_IN_SATS} sats`,
      );
    }
  }

  private addOutputs() {
    const reservedIndexes = this.injectableOutputs.map((o) => o.injectionIndex);
    const injectedIndexes: number[] = [];

    this.outputs.forEach((output, outputIndex) => {
      if (reservedIndexes.includes(outputIndex)) {
        const injectable = this.injectableOutputs.find(
          (o) => o.injectionIndex === outputIndex,
        )!;
        this.injectOutput(injectable);
        injectedIndexes.push(injectable.injectionIndex);
      }

      this.psbt.addOutput({
        address: output.address,
        value: output.value,
      });
    });

    this.injectableOutputs.forEach((injectable) => {
      if (injectedIndexes.includes(injectable.injectionIndex)) {
        return;
      }
      this.injectOutput(injectable);
      injectedIndexes.push(injectable.injectionIndex);
    });

    if (this.changeAmount >= MINIMUM_AMOUNT_IN_SATS) {
      this.psbt.addOutput({
        address: this.changeAddress || this.address,
        value: this.changeAmount,
      });
    }
  }

  private calculateOutputAmount() {
    this.outputAmount = Math.floor(
      this.outputs.reduce((acc, curr) => acc + curr.value, 0) +
        this.injectableOutputs.reduce((acc, curr) => acc + curr.sats, 0),
    );

    this.validateOutputAmount();
  }

  private async calculateChangeAmount() {
    if (!this.autoAdjustment) {
      return;
    }

    this.changeAmount = Math.floor(
      this.inputAmount - this.outputAmount - this.fee,
    );

    await this.isNegativeChange();
  }

  private async isNegativeChange() {
    if (this.changeAmount >= 0) {
      return;
    }

    await this.prepare();
    if (this.noMoreUTXOS) {
      throw new Error(
        `Insufficient balance. Decrease the output amount by ${
          this.changeAmount * -1
        } sats`,
      );
    }
  }

  private getRetrievedUTXOsValue() {
    return this.utxos.reduce((acc, utxo) => acc + utxo.sats, 0);
  }

  private getReservedUTXOs() {
    return this.utxos.map((utxo) =>
      generateTxUniqueIdentifier(utxo.txid, utxo.n),
    );
  }

  private getUTXOAmountToRequestFromChangeAmount() {
    if (this.changeAmount < 0) {
      return Math.abs(this.changeAmount);
    }

    return this.outputAmount - this.getRetrievedUTXOsValue();
  }

  private async retrieveUTXOs(address?: string, amount?: number) {
    if (!this.autoAdjustment && !address) {
      return;
    }

    const amountToRequest =
      amount && amount > 0
        ? amount
        : this.getUTXOAmountToRequestFromChangeAmount();
    if (
      (amount && this.getRetrievedUTXOsValue() >= amount) ||
      amountToRequest <= 0
    ) {
      return;
    }

    const utxos = await this.datasource.getSpendables({
      address: address || this.address,
      value: convertSatoshisToBTC(amountToRequest),
      filter: this.getReservedUTXOs(),
    });

    this.noMoreUTXOS = utxos.length === 0;

    this.utxos.push(...utxos);
  }

  protected async retrieveSelectedUTXOs(address: string, amount: number) {
    await this.retrieveUTXOs(address, amount);
    const selectedUTXOs = this.utxos.find((utxo) => utxo.sats >= amount);

    this.utxos = selectedUTXOs ? [selectedUTXOs] : [];

    return this.utxos;
  }

  private async prepareInputs() {
    if (!this.autoAdjustment) {
      return undefined;
    }

    const promises: Promise<InputType>[] = [];

    this.utxos.forEach((utxo) => {
      if (
        this.usedUTXOs.includes(generateTxUniqueIdentifier(utxo.txid, utxo.n))
      ) {
        return;
      }

      this.inputAmount += utxo.sats;
      const promise = processInput({
        utxo,
        pubKey: this.publicKey,
        network: this.network,
        datasource: this.datasource,
      }); // TODO: add sigHashType

      promises.push(promise);
    });

    const response = await Promise.all(promises);

    this.inputAmount += this.injectableInputs.reduce(
      (acc, curr) => acc + curr.sats,
      0,
    );
    response.forEach((input) => {
      const txUniqueIdentifier = generateTxUniqueIdentifier(
        input.hash,
        input.index,
      );
      if (this.usedUTXOs.includes(txUniqueIdentifier)) {
        return;
      }
      this.usedUTXOs.push(txUniqueIdentifier);
    });

    this.inputs = this.inputs.concat(response);

    return this.inputs;
  }

  async prepare() {
    // calculate output amount
    this.calculateOutputAmount();

    // fetch UTXOs to spend
    await this.retrieveUTXOs();
    await this.prepareInputs();

    await this.calculateChangeAmount();

    this.process();
    await this.calculateChangeAmount();
    this.calculateOutputAmount();

    this.process();
  }

  private process() {
    this.initPSBT();

    this.addInputs();
    this.addOutputs();

    this.calculateNetworkFee();

    return this;
  }
}
