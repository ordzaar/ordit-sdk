export const RUNE_NAME = "RUNE_TEST";
export const DEFAULT_RUNE_SCRIPT_INDEX = 0;
export const DEFAULT_RUNE_OUTPUT_INDEX = 1;
export const DEFAULT_RUNE_SAT_VALUE = 10_000; // copied from ord server

export enum TagEnum {
  Body = 0,
  Flags = 2,
  Rune = 4,
  Limit = 6,
  Term = 8,
  Deadline = 10,
  DefaultOutput = 12,
  Claim = 14,
  Burn = 126,

  Divisibility = 1,
  Spacers = 3,
  Symbol = 5,
  Nop = 127,
}

export enum FlagEnum {
  Etch = 0,
  Mint = 1,
  Burn = 127,
}

export type RuneId = bigint;

export interface Edict {
  id: bigint;
  amount: bigint;
  output: bigint;
}

export interface Mint {
  deadline?: number;
  limit?: bigint;
  term?: number;
}

export interface Etching {
  divisibility: number;
  mint?: Mint;
  rune?: RuneId;
  spacers: number;
  symbol?: string;
}

export interface Rune {
  burn?: boolean;
  claim?: RuneId;
  default_output?: number;
  edicts: Edict[];
  etching?: Etching;
}

export interface CreateRune {
  rune: string;
  symbol: string;
  /**
   * Token divisibility, example: -> 10, 0.0000000001
   */
  divisibility: number;
  /**
   * Mint deadline in timestamp
   */
  deadline?: number;
  /**
   * Remaining mint deadline in block -> 10, current block + 10
   */
  term?: number;
  /**
   * Limit per mint
   */
  limit?: bigint;
  /**
   * Supply premin
   */
  supply?: bigint;
}

export interface MintRune {
  rune?: string;
  /**
   * Edict id can be obtained from rune id, use this helper function getEdictIdFromRuneId
   */
  runeEdictId?: bigint;
  amount: bigint;
}

export interface RuneDetailMint {
  deadline?: number;
  end?: number;
  limit?: bigint;
}

export interface RuneDetail {
  rune_id: string;
  burned?: bigint;
  divisibility: number;
  etching: string;
  mint?: RuneDetailMint;
  mints: bigint;
  number: bigint;
  rune: string;
  rune_spaced: string;
  spacers: number;
  supply: bigint;
  symbol?: string;
  timestamp: number;
}

export interface RuneBalance {
  rune_spaced: string;
  amount: bigint;
  divisibility: number;
  symbol?: string;
  outpoints?: [string, bigint][];
}
