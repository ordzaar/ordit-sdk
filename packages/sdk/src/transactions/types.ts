import type { Inscription, Ordinal } from "../inscription/types";

// Types are based on bitcoin RPC
// Refer to https://bitcoincore.org/en/doc/25.0.0/rpc/rawtransactions/decoderawtransaction/

/**
 * Transaction output (Vout)
 */
export type Vout = {
  /**
   * Value in BTC
   */
  value: number;

  /**
   * Index
   */
  n: number;

  /**
   * Ordinals (Ordit RPC)
   */
  ordinals: Ordinal[];

  /**
   * Inscriptions (Ordit RPC)
   */
  inscriptions: Inscription[];

  /**
   * Is spent (Ordit RPC), can be Outpoint `{txid}:{vout}`, or `false` if not spent
   */
  spent: boolean;

  /**
   * Public key script
   */
  scriptPubKey: {
    /**
     * Diassembly of the public key script
     */
    asm: string;

    /**
     * Inferred descriptor for the output
     */
    desc: string;

    /**
     * The raw public key script bytes, hex-encoded
     */
    hex: string;

    /**
     * Type, for example, pubkeyhash
     */
    type: string;

    /**
     * Bitcoin address
     */
    address?: string;
  };
};

/**
 * Transaction input (Vin)
 */
export type Vin = {
  /**
   * Transaction id
   */
  txid: string;

  /**
   * Output number
   */
  vout: number;

  /**
   * Script that unlocks the input
   */
  scriptSig: {
    /**
     * Assembly
     */
    asm: string;

    /**
     * Hex
     */
    hex: string;
  };

  /**
   * Hex-encoded witness data
   */
  txinwitness?: string[];

  /**
   * Script sequence number
   */
  sequence: number;
};

export type Transaction = {
  hex?: string;
  txid: string;
  hash: string;
  size: number;
  vsize: number;
  version: number;
  locktime: number;
  vin: Vin[];
  vout: Vout[];
  blockhash: string;
  confirmations: number;
  time: number;
  blocktime: number;
  weight: number;
  fee: number;
  blockheight: number;
};

export interface ScriptPubKey {
  asm: string;
  desc: string;
  hex: string;
  address: string;
  type: string;
}

export interface UTXO {
  n: number;
  txid: string;
  sats: number;
  scriptPubKey: ScriptPubKey;
  safeToSpend: boolean;
  confirmation: number;
}

export type UTXOLimited = Pick<UTXO, "txid" | "n" | "sats" | "scriptPubKey">;

export interface Output {
  /**
   * Address
   */
  address: string;

  /**
   * Value in satoshis
   */
  value: number;
}

export interface SkipStrictSatsCheckOptions {
  skipStrictSatsCheck?: boolean;
  customAmount?: number;
}
