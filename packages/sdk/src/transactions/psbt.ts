import type { Network } from "../config/types";
import type { OnOffUnion } from "../wallet/types";
import { PSBTBuilder } from "./PSBTBuilder";
import type { Output } from "./types";

export type CreatePsbtOptions = {
  satsPerByte: number;
  address: string;
  outputs: Output[];

  /**
   * Enable Replace-by-fee (RBF).
   *
   * Replace-by-fee (RBF) is a feature that allows users to replace one version of an unconfirmed transaction
   * with a different version of the transaction that pays a higher transaction fee.
   * This can be done multiple times while the transaction is unconfirmed.
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

  psbt.setRBF(enableRBF);
  await psbt.prepare();

  return {
    hex: psbt.toHex(),
    base64: psbt.toBase64(),
  };
}
