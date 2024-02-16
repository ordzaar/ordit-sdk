import type { Rarity } from "../../inscription/types";
import { ScriptPubKey } from "../../transactions/types";

// ***** Address APIs *****

// Get Balance
export type GetBalanceApiResponse = {
  balance: number;
};

// Get Unspents
export enum SpentOrder {
  SATS_ASCENDING = "SATS_ASCENDING",
  SATS_DESCENDING = "SATS_DESCENDING",
}

export type GetUnspentsApiOptions = {
  allowedRarities?: Rarity[];
  safetospend?: boolean;
  orderBy?: SpentOrder;
  size?: number;
  next?: string;
};

export type Unspent = {
  id: string;
  txid: string;
  n: number;
  sats: number;
  scriptPubKey: ScriptPubKey;
  txhex?: string;
  ordinals: Ordinal[];
  inscriptions: Inscription[];
  safeToSpend: boolean;
  confirmations: number;
};

export type GetUnspentsApiResponse = {
  data: Unspent[];
  page: {
    next: string;
  };
};

// Get Spendables
export type GetSpendablesApiOptions = {
  value: number;
  safetospend?: boolean;
  filter?: string[];
};

export type Spendable = {
  id: string;
  txid: string;
  n: number;
  sats: number;
  scriptPubKey: ScriptPubKey;
};

export type GetSpendablesApiResponse = {
  data: Spendable[];
  page: {
    next: string;
  };
};

// ***** Ordinals APIs *****

// Get Inscription
export type Inscription = {
  id: string;
  inscriptionId: string;
  outputId: string;
  creator: string;
  owner: string;
  sat: number;
  mimeType: string | null;
  mimeSubtype: string | null;
  mediaType: string | null;
  mediaCharset: string | null;
  mediaSize: number;
  mediaContentId: string;
  timestamp: number;
  height: number;
  fee: number;
  genesis: string;
  number: number;
  sequence: number;
  outpoint: string;
  ethereum: string | null;
  verified: boolean | null;
  meta?: Record<string, unknown>;
  ometa?: Record<string, unknown>;
};

export type Ordinal = {
  number: number;
  decimal: string;
  degree: string;
  name: string;
  height: number;
  cycle: number;
  epoch: number;
  period: number;
  offset: number;
  rarity: Rarity;
  output: string;
  start: number;
  end: number;
  size: number;
};

export type GetInscriptionResponse = Inscription & {
  mediaContent?: string;
  value?: number;
};

// Get Inscription UTXO
export type GetInscriptionUTXOResponse = {
  txid: string;
  n: number;
  sats: number;
  scriptPubKey: ScriptPubKey;
  safeToSpend: boolean;
  confirmations: number;
};

// Get Inscriptions
export enum InscriptionOrder {
  NUMBER_ASCENDING = "NUMBER_ASCENDING",
  NUMBER_DESCENDING = "NUMBER_DESCENDING",
}

export type GetInscriptionsApiOptions = {
  creator?: string;
  owner?: string;
  mimeType?: string;
  mimeSubtype?: string;
  outpoint?: string;
  include?: string[];
  orderBy?: InscriptionOrder;
  next?: string;
  size?: number;
};

export type GetInscriptionsApiResponse = {
  data: GetInscriptionResponse[];
  page: {
    next: string;
  };
};

// ***** Transactions APIs *****

// Get Transaction
export type GetTranscationApiOptions = {
  ord?: boolean;
  hex?: boolean;
  witness?: boolean;
};

export type ExpandedVout = {
  value: number;
  n: number;
  scriptPubKey: ScriptPubKey;
  ordinals: Ordinal[];
  inscriptions: (Inscription & {
    mediaContent?: string;
  })[];
  spent: boolean;
};

export type ExpandedVin = {
  txid: string;
  vout: number;
  scriptSig: {
    asm: string;
    hex: string;
  };
  sequence: number;
  txinwitness?: string[];
  value: number;
  address: string[];
};

export type GetTransactionApiResponse = {
  hex?: string;
  txid: string;
  hash: string;
  size: number;
  vsize: number;
  weight: number;
  version: number;
  locktime: number;
  vin: ExpandedVin[];
  vout: ExpandedVout[];
  blockhash: string;
  confirmations: number;
  blocktime: number;
  time: number;
  blockheight: number;
  fee: number;
};

export type RelayApiBody = {
  hex: string;
  maxFeeRate?: number;
  validate?: boolean;
};

export type GetInscriptionContentApiResponse = {
  contentType: string;
  contentLength: number;
  buffer: Buffer;
};
