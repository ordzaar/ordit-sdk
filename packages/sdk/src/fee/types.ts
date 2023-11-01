import type { Psbt } from "bitcoinjs-lib";
import type { Buffer } from "buffer";
import type { Network } from "../config/types";

export interface FeeEstimatorOptions {
  /**
   * Fee rate in Satoshi per byte (sats/vB). Can only be a whole number.
   */
  feeRate: number;

  /**
   * Network to be selected
   */
  network: Network;

  /**
   * Partially Signed Bitcoin Transaction
   */
  psbt?: Psbt;

  /**
   * Witness data
   */
  witness?: Buffer[];
}
