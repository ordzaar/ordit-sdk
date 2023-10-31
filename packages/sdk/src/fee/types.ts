import type { Psbt } from "bitcoinjs-lib";
import type { Buffer } from "buffer";
import type { Network } from "../config/types";

export interface FeeEstimatorOptions {
  feeRate: number;
  network: Network;
  psbt?: Psbt;
  witness?: Buffer[];
}
