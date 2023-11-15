import * as ecc from "@bitcoinerlab/secp256k1";
import { BIP32Factory } from "bip32";
import { Buffer } from "buffer";

/**
 * Amount lower than this is considered as dust value
 * and majority of the miners don't pick txs w/ the following output value or lower
 */
export const MINIMUM_AMOUNT_IN_SATS = 600;

/**
 * Fee calculated by the fee estimator cannot be greater than 0.05 BTC in any case
 */
export const MAXIMUM_FEE = 5_000_000;

/**
 * Maximum number of bytes pushable to the witness stack
 */
export const MAXIMUM_SCRIPT_ELEMENT_SIZE = 520;

/**
 * Input from seller PSBT when unwrapped & merged,
 * is placed on the 2nd index in instant-buy-sell flow
 */
export const INSTANT_BUY_SELLER_INPUT_INDEX = 2;

/**
 * BIP32 instance
 */
export const BIP32 = BIP32Factory(ecc);

/**
 * Fixed chain code for public key operations
 */
export const CHAIN_CODE = Buffer.alloc(32, 1);
