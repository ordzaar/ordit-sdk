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

export type Edict = {
  id: bigint;
  amount: bigint;
  output: bigint;
};

export type Mint = {
  deadline?: number;
  limit?: bigint;
  term?: number;
};

export type Etching = {
  divisibility: number;
  mint?: Mint;
  rune?: RuneId;
  spacers: number;
  symbol?: string;
};

export type Rune = {
  burn?: boolean;
  claim?: RuneId;
  default_output?: number;
  edicts: Edict[];
  etching?: Etching;
};

export type CreateRune = {
  rune: string;
  symbol: string;
  divisibility: number; // token divisibility -> 10, 0.0000000001
  deadline?: number; // mint deadline in timestamp
  term?: number; // remaining mint deadline in block -> 10, current block + 10
  limit?: bigint; // limit per mint
  supply?: bigint; // max total supply
};

export type MintRune = {
  rune?: string;
  runeEdictId?: bigint; // edict id can be obtained from rune id, use this helper function getEdictIdFromRuneId
  amount: bigint;
};
