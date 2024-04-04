import type { Transaction as BTCTransaction } from "bitcoinjs-lib";

import type { Rarity } from "../inscription/types";
import type { Transaction, UTXO, UTXOLimited } from "../transactions/types";
import type { RequireAtLeastOne } from "../utils/types";

export interface GetUnspentsOptions {
  /**
   * Address to list unspent UTXOs for
   */
  address: string;

  /**
   * Types of UTXOs
   */
  type?: "all" | "spendable";

  /**
   * List of rarities that defines safe to spend threshold
   */
  rarity?: Rarity[];

  /**
   * Sorting order
   */
  sort?: "asc" | "desc";

  /**
   * Amount of items to retrieve in a single request
   */
  limit?: number;

  /**
   * Fetch records in forward order starting from the given cursor
   */
  next?: string | null;
}

export interface GetUnspentsResponse {
  totalUTXOs: number;
  spendableUTXOs: UTXO[];
  unspendableUTXOs: UTXO[];
}

export interface GetTransactionOptions {
  /**
   * Transaction id to retrieve from the blockchain
   */
  txId: string;

  /**
   * Include ordinal and inscription information in transaction outputs response
   */
  ordinals?: boolean;

  /**
   * Include transaction hex in response
   */
  hex?: boolean;

  /**
   * Include witness data in response
   */
  witness?: boolean;

  /**
   * Decode inscription metadata into [valid URI components](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent)
   */
  decodeMetadata?: boolean;
}

export interface GetTransactionResponse {
  tx: Transaction;
  rawTx?: BTCTransaction;
}

export interface GetInscriptionUTXOOptions {
  id: string;
}

export type GetInscriptionsOptions = RequireAtLeastOne<{
  creator?: string;
  owner?: string;
  mimeType?: string;
  mimeSubType?: string;
  outpoint?: string;
}> & {
  sort?: "asc" | "desc";
  limit?: number;
  next?: string | null;
  decodeMetadata?: boolean;
};

export interface GetInscriptionOptions {
  /**
   * Inscription id
   */
  id: string;

  /**
   * Decode inscription metadata into [valid URI components](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent)
   */
  decodeMetadata?: boolean;
}

export interface RelayOptions {
  /**
   * Raw transaction as hex string used to submit the transaction to the blockchain.
   */
  hex: string;

  /**
   * Reject transactions whose fee rate is higher than the specified value, expressed in BTC/kB.
   *
   * Set to 0 to accept any fee rate.
   */
  maxFeeRate?: number;

  /**
   * Performs some basic validation against our local UTXO data to verify that the transaction has valid inputs using our own internal tracking of unconfirmed spent states.
   */
  validate?: boolean;
}

export interface GetSpendablesOptions {
  /**
   * Address to list spendable UTXOs for
   */
  address: string;

  /**
   * Value to spend
   */
  value: number;

  /**
   * Types of UTXOs
   */
  type?: "all" | "spendable";

  /**
   * List of rarities that defines safe to spend threshold
   */
  rarity?: Rarity[];

  /**
   * Filter
   */
  filter?: string[];

  /**
   * Amount of items to retrieve in a single request
   */
  limit?: number;
}

export interface GetInfo {
  id: string;
  chain: string;
  status: string;
  synced: boolean;
  indexes: {
    blockchain: number;
    ordit: number;
    ord: number;
  };
}

export interface GetBalanceOptions {
  address: string;
}

export interface GetRuneOptions {
  runeQuery: string;
}

export interface GetRuneTerms {
  amount?: string;
  cap?: string;
  height?: [string | null, string | null];
  offset?: [string | null, string | null];
}

export interface GetRuneResponse {
  rune_id: string;
  rune: string;
  spaced_rune: string;
  mintable: boolean;
  block: string;
  divisibility: number;
  etching: string;
  mints: string;
  number: string;
  premine: string;
  terms?: GetRuneTerms;
  symbol?: string;
  burned?: string;
  timestamp: string;
}

export interface GetRuneBalancesOptions {
  address: string;
  showOutpoints?: boolean;
  utxo?: boolean;
}

export interface GetRuneBalanceResponse {
  spaced_rune: string;
  amount: string;
  divisibility: number;
  symbol?: string;
  outpoints?: {
    outpoint: string;
    amount: string;
    utxo?: UTXOLimited;
  }[];
}

export interface GetRuneSpendablesOptions {
  address: string;
  spacedRune: string;
  amount: bigint;
}

export interface GetRuneSpendablesResponse {
  utxos: {
    utxo: UTXOLimited;
    amount: string;
  }[];
  changeAmount: string;
}
