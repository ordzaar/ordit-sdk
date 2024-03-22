export const RUNE_NAME = "RUNE_TEST";

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
