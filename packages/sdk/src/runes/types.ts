export const RUNE_NAME = "RUNE_TEST";

export enum TagEnum {
  Body = 0,
  Flags = 2,
  Rune = 4,
  Limit = 6,
  Term = 8,
  Deadline = 10,
  DefaultOutput = 12,
  Burn = 254,

  Divisibility = 1,
  Spacers = 3,
  Symbol = 5,
  Nop = 255,
}

export enum FlagEnum {
  Etch = 0,
  Mint = 1,
  Burn = 127,
}

export type Edict = {
  id: number;
  amount: number;
  output: number;
};

export type Mint = {
  deadline?: number;
  limit?: number;
  term?: number;
};

export type Etching = {
  divisibility: number;
  mint?: Mint;
  rune?: number;
  spacers: number;
  symbol?: string;
};

export type Rune = {
  burn?: boolean;
  claim?: number;
  default_output?: number;
  edicts: Edict[];
  etching?: Etching;
};
