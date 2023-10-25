import type { AddressFormat } from "../addresses/types";

export type WalletAddress = {
  pub: string;
  address: string;
  format: AddressFormat;
};

export interface BrowserWalletSignPSBTOptions {
  finalize?: boolean;
  extractTx?: boolean;
}

export interface BrowserWalletSignResponse {
  hex: string;
  base64: string | null;
}
