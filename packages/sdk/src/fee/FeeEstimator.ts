import { Psbt } from "bitcoinjs-lib";
import { Buffer } from "buffer";

import type { AddressFormat } from "../addresses/types";
import type { Network } from "../config/types";
import { MAXIMUM_FEE } from "../constants";
import { OrditSDKError } from "../errors";
import { getNetwork, getScriptType } from "../utils";
import type { FeeEstimatorOptions } from "./types";

function getBaseSizeByType(type: AddressFormat) {
  // Refer to BIP-0141 - https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki
  // Calculator - https://bitcoinops.org/en/tools/calc-size/
  switch (type) {
    case "taproot":
      return { input: 42, output: 43, txHeader: 10.5, witness: 66 }; // witness size is different for non-default sigHash

    case "segwit":
      return { input: 41, output: 31, txHeader: 10.5, witness: 105 };

    case "p2sh-p2wpkh":
      return { input: 64, output: 32, txHeader: 10, witness: 105 };

    case "legacy":
      return { input: 148, output: 34, txHeader: 10, witness: 0 };

    default:
      throw new OrditSDKError("Invalid type");
  }
}

class FeeEstimator {
  protected fee = 0;

  protected feeRate: number;

  protected network: Network;

  protected psbt: Psbt;

  protected witness?: Buffer[] = [];

  protected virtualSize = 0;

  protected weight = 0;

  constructor({ feeRate, network, psbt, witness }: FeeEstimatorOptions) {
    // feeRate can be 0 because a seller does not pay for network fees
    if (feeRate < 0 || !Number.isSafeInteger(feeRate)) {
      throw new OrditSDKError("Invalid feeRate");
    }

    this.feeRate = feeRate;
    this.network = network;
    this.witness = witness || [];
    this.psbt = psbt || new Psbt({ network: getNetwork(this.network) });
  }

  get data() {
    return {
      fee: this.fee,
      virtualSize: this.virtualSize,
      weight: this.weight,
    };
  }

  calculateNetworkFee(): number {
    this.fee = this.calculateVirtualSize() * this.feeRate;
    // Prevents catastrophic calculations from happening
    if (this.fee > MAXIMUM_FEE) {
      throw new OrditSDKError("Error while calculating fees");
    }

    return this.fee;
  }

  private getInputAndOutputScriptTypes() {
    const { inputs } = this.psbt.data;
    const outputs = this.psbt.txOutputs;

    if (inputs.length === 0) {
      throw new OrditSDKError("PSBT must have at least one input");
    }

    if (outputs.length === 0) {
      throw new OrditSDKError("PSBT must have at least one output");
    }

    return {
      inputTypes: inputs.map((input) => {
        // P2PKH (Legacy) is not supported as there is no witness script.
        const script =
          input.witnessUtxo && input.witnessUtxo.script
            ? input.witnessUtxo.script
            : null;

        if (!script) {
          throw new OrditSDKError("Invalid script");
        }

        return getScriptType(script, this.network).format;
      }),
      outputTypes: outputs.map(
        (output) => getScriptType(output.script, this.network).format,
      ),
    };
  }

  private calculateScriptWitnessSize() {
    const { inputTypes } = this.getInputAndOutputScriptTypes();
    if (inputTypes.includes("taproot") && this.witness?.length) {
      return this.witness.reduce((acc, witness) => acc + witness.byteLength, 0);
    }
    return 0;
  }

  private getBaseSize() {
    const { inputTypes, outputTypes } = this.getInputAndOutputScriptTypes();
    const witnessHeaderSize = 2;
    const inputVBytes = inputTypes.reduce(
      (acc, inputType) => {
        const { input, txHeader, witness } = getBaseSizeByType(inputType);
        acc.txHeader = txHeader;
        acc.input += input;
        acc.witness += witness;

        return acc;
      },
      {
        input: 0,
        witness: 0,
        txHeader: 0,
      },
    );
    const outputVBytes = outputTypes.reduce((acc, outputType) => {
      const { output } = getBaseSizeByType(outputType);
      return acc + output;
    }, 0);
    const witnessSize =
      inputVBytes.witness +
      (this.witness?.length ? this.calculateScriptWitnessSize() : 0);

    let totalWitnessSize = 0;
    if (this.witness?.length) {
      totalWitnessSize = witnessSize;
    } else if (witnessSize > 0) {
      totalWitnessSize = witnessHeaderSize + witnessSize;
    }

    return {
      baseSize: inputVBytes.input + inputVBytes.txHeader + outputVBytes,
      witnessSize: totalWitnessSize,
    };
  }

  private calculateVirtualSize() {
    const { baseSize, witnessSize } = this.getBaseSize();
    this.weight = baseSize * 3 + (baseSize + witnessSize);
    this.virtualSize = Math.ceil(this.weight / 4);

    return this.virtualSize;
  }
}

export { FeeEstimator };
