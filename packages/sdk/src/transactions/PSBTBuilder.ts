import { Psbt, Transaction } from "bitcoinjs-lib";
import reverseBuffer from "buffer-reverse";

import type { Network } from "../config/types";
import {
  INSTANT_BUY_SELLER_INPUT_INDEX,
  MINIMUM_AMOUNT_IN_SATS,
} from "../constants";
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
  network?: Network;
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

  /**
   * Change amount in satoshis
   */
  protected changeAmount: number = 0;

  protected datasource: BaseDatasource;

  protected injectableInputs: InjectableInput[] = [];

  protected injectableOutputs: InjectableOutput[] = [];

  /**
   * Input amount in satoshis
   */
  protected inputAmount: number = 0;

  protected inputs: InputType[] = [];

  /**
   * Output amount in satoshis
   */
  protected outputAmount: number = 0;

  protected outputs: Output[] = [];

  protected psbt: Psbt;

  protected publicKey: string;

  /**
   * Replace-by-fee (RBF) is a feature that allows users to replace one version of an unconfirmed transaction
   * with a different version of the transaction that pays a higher transaction fee.
   * This can be done multiple times while the transaction is unconfirmed.
   *
   * Reference: [BIP-125](https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki)
   */
  protected rbf: boolean = true;

  protected utxos: UTXOLimited[] = [];

  protected usedUTXOs: string[] = [];

  /**
   * Enable auto adjustment.
   *
   * When `true`, change is calculated and UTXOs will be added as required to account for network fees.
   *
   * Otherwise, change is not calculated and no UTXOs will be added.
   */
  private autoAdjustment: boolean;

  private instantTradeMode: boolean;

  private noMoreUTXOS: boolean = false;

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
    network = "mainnet",
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
    this.publicKey = publicKey;

    this.autoAdjustment = autoAdjustment;
    this.instantTradeMode = instantTradeMode;

    this.psbt = new Psbt({ network: getNetwork(network) });
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

  /**
   * Set Replace-by-fee (RBF) value
   *
   * Replace-by-fee (RBF) is a feature that allows users to replace one version of an unconfirmed transaction
   * with a different version of the transaction that pays a higher transaction fee.
   * This can be done multiple times while the transaction is unconfirmed.
   *
   * Reference: [BIP-125](https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki)
   */
  setRBF(value: boolean) {
    this.rbf = value;
    this.addInputs();
  }

  /**
   * Gets the x-coordinate of the public key.
   */
  get xKey() {
    return toXOnly(Buffer.from(this.publicKey, "hex")).toString("hex");
  }

  get inputsToSign() {
    const instantTradeSellerFlow =
      this.instantTradeMode && !this.autoAdjustment;
    return this.psbt.txInputs.reduce<InputsToSign>(
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
      },
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
    // TODO: remove hack
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.psbt.data.globalMap.unsignedTx as any).tx.ins[
      injectable.injectionIndex
    ] = injectable.txInput;
    this.psbt.data.inputs[injectable.injectionIndex] = injectable.standardInput;
  }

  private injectOutput(injectable: InjectableOutput) {
    let potentialIndex = injectable.injectionIndex;

    do {
      // TODO: remove hack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isReserved = !!(this.psbt.data.globalMap.unsignedTx as any).tx.outs[
        potentialIndex
      ];
      if (!isReserved) {
        // TODO: remove hack
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.psbt.data.globalMap.unsignedTx as any).tx.outs[potentialIndex] =
          injectable.txOutput;
        this.psbt.data.outputs[potentialIndex] =
          // TODO: remove hack
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

      if ("address" in output) {
        this.psbt.addOutput({
          address: output.address,
          value: output.value,
        });
      }

      if ("script" in output) {
        this.psbt.addOutput({
          script: output.script,
          value: output.value,
        });
      }
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

    if (this.outputAmount < MINIMUM_AMOUNT_IN_SATS) {
      throw new Error(
        `Output amount too low. Minimum output amount needs to be ${MINIMUM_AMOUNT_IN_SATS} sats`,
      );
    }
  }

  /**
   * Calculates change amount from transaction and fetches additional UTXOs as required to cover output and network fees, if change is negative.
   */
  private async recursivelyCalculateChangeAmount() {
    if (!this.autoAdjustment) {
      return;
    }

    this.changeAmount = Math.floor(
      this.inputAmount - this.outputAmount - this.fee,
    );

    if (this.changeAmount < 0) {
      // Repeatedly fetch additional UTXOs as required to cover output and network fee
      await this.prepare();
      if (this.noMoreUTXOS) {
        throw new Error(
          `Insufficient balance. Decrease the output amount by ${
            this.changeAmount * -1
          } sats`,
        );
      }
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

  /**
   * Retrieves UTXOs using `getSpendables` RPC.
   *
   * @param address Address
   * @param amount Amount in satoshis
   */
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

  /**
   * Prepares inputs from UTXOs.
   */
  private async prepareInputs(): Promise<void> {
    if (!this.autoAdjustment) {
      return;
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
  }

  /**
   * Prepares PSBT to be set to a network, calculating and validating both inputs and outputs.
   */
  async prepare() {
    // calculate output amount
    this.calculateOutputAmount();

    // fetch UTXOs to spend
    await this.retrieveUTXOs();
    await this.prepareInputs();

    // Note: fee is still 0 here
    await this.recursivelyCalculateChangeAmount();

    this.process();

    // Repeat the following steps because network fee could be added to input, and a new UTXO will be used to cover it.
    // We also need to add the change to output for the network fee.
    await this.recursivelyCalculateChangeAmount();
    this.calculateOutputAmount();
    this.process();
  }

  /**
   * Initializes PSBT instance, adding all inputs and outputs and calculates network fees.
   *
   * @returns PSBTBuilder instance
   */
  private process() {
    this.initPSBT();

    this.addInputs();
    this.addOutputs();

    this.calculateNetworkFee();

    return this;
  }
}
