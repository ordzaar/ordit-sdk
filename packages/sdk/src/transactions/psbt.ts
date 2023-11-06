import type { Network } from "../config/types";
import { PSBTBuilder } from "./PSBTBuilder";
import type { Output } from "./types";

export type CreatePsbtOptions = {
  /**
   * Sats per byte (Used to calculate fee rate)
   */
  satsPerByte: number;

  /**
   * Address of sender of the transaction
   */
  address: string;

  /**
   * Outputs of the transaction
   */
  outputs: Output[];

  /**
   * Enable Replace-by-fee (RBF)
   *
   * Replace-by-fee (RBF) is a feature that allows users to replace one version of an unconfirmed transaction
   * with a different version of the transaction that pays a higher transaction fee.
   * This can be done multiple times while the transaction is unconfirmed.
   *
   * Reference: [BIP-125](https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki)
   */
  enableRBF?: boolean;

  /**
   * Public key of address
   */
  pubKey: string;

  /**
   * Network used for the transaction
   */
  network: Network;
};

/**
 * Creates a Partially Signed Bitcoin Transaction (PSBT).
 *
 * @param options Options for creating PSBT
 * @returns An object containing `base64` and `hex`.
 */
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
