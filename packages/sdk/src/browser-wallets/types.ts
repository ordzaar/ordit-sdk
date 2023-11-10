import type { AddressFormat } from "../addresses/types";

export type WalletAddress = {
  publicKey: string;
  address: string;
  format: AddressFormat;
};

export interface BrowserWalletSignPSBTOptions {
  /**
   * Finalize the inputs of a PSBT.
   *
   * If the transaction is fully signed, it will produce a PSBT which can be extracted.
   */
  finalize?: boolean;

  /**
   * Extract and return the complete transaction in normal network serialization instead of the PSBT.
   */
  extractTx?: boolean;
}

export interface BrowserWalletSignResponse {
  hex: string;
  base64: string | null;
}
