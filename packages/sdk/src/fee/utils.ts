import * as ecc from "@bitcoinerlab/secp256k1";
import { Psbt, networks, initEccLib } from "bitcoinjs-lib";
import { P2SH_P2WPKH, P2TR, P2WPKH } from "./__fixtures__/psbt.fixture";
import { AddressFormat } from "../addresses/types";

/**
 * Creates a mock Psbt for testing.
 *
 * References:
 * - https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/transactions.spec.ts
 * - https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/taproot.spec.ts
 *
 * @returns Psbt
 */
function createMockPsbt(format: Exclude<AddressFormat, "legacy">) {
  switch (format) {
    case "p2sh-p2wpkh":
      return new Psbt({ network: networks.regtest })
        .addInputs(P2SH_P2WPKH.INPUTS)
        .addOutputs(P2SH_P2WPKH.OUTPUTS);
    case "segwit":
      return new Psbt({ network: networks.regtest })
        .addInputs(P2WPKH.INPUTS)
        .addOutputs(P2WPKH.OUTPUTS);
    case "taproot":
      // taproot psbt script contains OP_CHECKSEQUENCEVERIFY, requires Ecc lib
      initEccLib(ecc);
      return new Psbt({ network: networks.regtest })
        .addInputs(P2TR.INPUTS)
        .addOutputs(P2TR.OUTPUTS);
    default:
      throw new Error("Not implemented");
  }
}

export { createMockPsbt };
