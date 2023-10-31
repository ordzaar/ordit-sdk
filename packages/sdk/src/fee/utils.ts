import { Psbt } from "bitcoinjs-lib";
import { P2SH_P2WPKH } from "./__fixtures__/psbt.fixture";
import { AddressFormat } from "../addresses/types";

/**
 * Creates a mock Psbt for testing.
 *
 * Reference: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/transactions.spec.ts
 *
 * @returns Psbt
 */
function createMockPsbt(format: Exclude<AddressFormat, "legacy">) {
  if (format === "p2sh-p2wpkh") {
    return new Psbt()
      .addInputs(P2SH_P2WPKH.INPUTS)
      .addOutputs(P2SH_P2WPKH.OUTPUTS);
  }

  throw new Error("Not implemented");
}

export { createMockPsbt };
