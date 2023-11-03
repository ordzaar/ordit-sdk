import type { Inscription } from "../inscription/types";
import type { UTXO } from "../transactions/types";

export interface JsonRpcPagination {
  limit: number;
  prev: string | null;
  next: string | null;
}

export interface OrdinalsGetInscriptionsJsonRpcResponse {
  inscriptions: Inscription[];
  pagination: JsonRpcPagination;
}

export interface AddressGetUnspentsJsonRpcResponse {
  unspents: UTXO[];
  pagination: JsonRpcPagination;
}
