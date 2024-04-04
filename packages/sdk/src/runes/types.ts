import { opcodes } from "bitcoinjs-lib";

import { UTXOLimited } from "../transactions/types";

export const RUNE_NUMBER_STEPS: bigint[] = [
  0n,
  26n,
  702n,
  18278n,
  475254n,
  12356630n,
  321272406n,
  8353082582n,
  217180147158n,
  5646683826134n,
  146813779479510n,
  3817158266467286n,
  99246114928149462n,
];

export const MINIMUM_UTXO_CONFIRMATIONS = 6;
export const HALVING_INTERVAL = 210_000n;
export const MAX_STEP = 12n;
export const INTERVAL = HALVING_INTERVAL / MAX_STEP;

// rune magic code is OP_13
export const RUNE_OP_CODE = opcodes.OP_13;

export const DEFAULT_RUNE_SCRIPT_INDEX = 0;
export const DEFAULT_RUNE_OUTPUT_INDEX = 1;
export const DEFAULT_RUNE_SAT_VALUE = 10_000; // copied from ord server

export const DEFAULT_MINT_POINTER = 0;
export const DEFAULT_CREATE_POINTER = 0;
export const DEFAULT_TRANSFER_RECEIVER_OUTPUT = 0;
export const DEFAULT_TRANSFER_CHANGE_OUTPUT = 1;

export enum TagEnum {
  Body = 0,
  Flags = 2,
  Rune = 4,
  Premine = 6,
  Cap = 8,
  Amount = 10,
  HeightStart = 12,
  HeightEnd = 14,
  OffsetStart = 16,
  OffsetEnd = 18,
  Mint = 20,
  Pointer = 22,
  Cenotaph = 126,

  Divisibility = 1,
  Spacers = 3,
  Symbol = 5,
  Nop = 127,
}

export enum FlagEnum {
  Etching = 0,
  Terms = 1,
  Cenotaph = 127,
}

export interface RuneId {
  block: bigint;
  tx: number;
}

export interface Edict {
  id: RuneId;
  amount: bigint;
  output: bigint;
}

export interface Terms {
  amount?: bigint;
  cap?: bigint;
  height?: {
    start?: bigint;
    end?: bigint;
  };
  offset?: {
    start?: bigint;
    end?: bigint;
  };
}

export interface Etching {
  divisibility?: number;
  premine?: bigint;
  rune?: bigint;
  spacers: number;
  symbol?: string;
  terms?: Terms;
}

export interface Rune {
  pointer?: number;
  mint?: RuneId; // runeid
  edicts: Edict[];
  etching?: Etching;
}

export interface CreateRune {
  rune: string;
  divisibility?: number;
  premine?: bigint;
  symbol: string;
  terms?: {
    amount?: bigint;
    cap?: bigint;
    height?: {
      start?: bigint;
      end?: bigint;
    };
    offset?: {
      start?: bigint;
      end?: bigint;
    };
  };

  pointer?: number;
  validateMinimumHeight?: boolean;
}

export interface MintRune {
  spacedRune: string;
  receiveAddress?: string;
}

export interface TransferRune {
  spacedRune: string;
  receiveAddress?: string;
  amount: bigint;
}

export interface RuneDetailTerms {
  amount?: bigint;
  cap?: bigint;
  height?: [bigint | undefined, bigint | undefined];
  offset?: [bigint | undefined, bigint | undefined];
}

export interface RuneDetail {
  rune_id: string;
  rune: string;
  spaced_rune: string;
  mintable: boolean;
  block: bigint;
  divisibility: number;
  etching: string;
  mints: bigint;
  number: bigint;
  premine: bigint;
  terms?: RuneDetailTerms;
  symbol?: string;
  burned?: bigint;
  timestamp: number;
}

export interface RuneBalance {
  spaced_rune: string;
  amount: bigint;
  divisibility: number;
  symbol?: string;
  outpoints?: {
    outpoint: string;
    amount: bigint;
    utxo?: UTXOLimited;
  }[];
}

export interface RuneSpendables {
  utxos: {
    utxo: UTXOLimited;
    amount: bigint;
  }[];
  changeAmount: bigint;
}
