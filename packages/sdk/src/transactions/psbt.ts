import type { Network } from "../config/types";
import type { OnOffUnion } from "../wallet/types";
import { PSBTBuilder } from "./PSBTBuilder";
import type { Output } from "./types";

export type CreatePsbtOptions = {
  satsPerByte: number;
  address: string;
  outputs: Output[];

  /**
   * Enable Replace By Fee (RBF).
   *
   * Replace-By-Fee is a node policy that allows an unconfirmed transaction in a mempool
   * to be replaced with a different transaction that spends at least one of the same inputs and which pays a higher transaction fee.
   *
   * Refer to [BIP-125](https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki).
   */
  enableRBF?: boolean;
  pubKey: string;
  network: Network;
  safeMode?: OnOffUnion;
};

export async function createPsbt({
  pubKey,
  network,
  address,
  outputs,
  satsPerByte,
  enableRBF = true,
}: CreatePsbtOptions) {
  if (!outputs.length) {
    throw new Error("Invalid request");
  }

  const psbt = new PSBTBuilder({
    address,
    feeRate: satsPerByte,
    network,
    publicKey: pubKey,
    outputs,
  });

  if (enableRBF) {
    psbt.enableRBF();
  } else {
    psbt.disableRBF();
  }
  await psbt.prepare();

  return {
    hex: psbt.toHex(),
    base64: psbt.toBase64(),
  };
}
