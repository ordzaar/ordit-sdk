import type { Psbt } from "bitcoinjs-lib";
import type { AddressFormats } from "../addresses/formats";
import type { Network } from "../networks/types";

export type WalletAddress = {
  pub: string;
  address: string;
  format: AddressFormats;
};

export interface BrowserWalletSignPSBTOptions {
  finalize?: boolean;
  extractTx?: boolean;
}

export interface BrowserWalletSignPSBTResponse {
  hex: string;
  base64: string | null;
}

export interface BrowserWallet {
  /**
   * Checks if the browser wallet extension is installed.
   *
   * @returns `true` if installed, `false` otherwise.
   */
  isInstalled: () => boolean;
  getAddresses: (network: Network) => Promise<WalletAddress[]>;
  signPsbt: (
    psbt: Psbt,
    options: BrowserWalletSignPSBTOptions,
  ) => Promise<BrowserWalletSignPSBTResponse>;
  signMessage: (message: string) => Promise<BrowserWalletSignPSBTResponse>;
}
