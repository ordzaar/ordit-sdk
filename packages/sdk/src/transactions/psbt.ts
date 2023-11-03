import type { Network } from "../config/types";
import type { OnOffUnion } from "../wallet/types";
import { PSBTBuilder } from "./PSBTBuilder";
import type { Output } from "./types";

export type CreatePsbtOptions = {
  satsPerByte: number;
  address: string;
  outputs: Output[];
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
