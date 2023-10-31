import type { Psbt } from "bitcoinjs-lib";
import type { Network } from "../config/types";
import type { Buffer } from "buffer";

export interface FeeEstimatorOptions {
  feeRate: number;
  network: Network;
  psbt?: Psbt;
  witness?: Buffer[];
}
