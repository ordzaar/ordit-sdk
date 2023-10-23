import type { AddressFormats } from "../addresses/formats";
import type { Network } from "../networks/types";

export interface BrowserWallet {
  /**
   * Checks if the browser wallet extension is installed.
   *
   * @returns `true` if installed, `false` otherwise.
   */
  isInstalled: () => boolean;
  getAddresses: (network: Network) => Promise<WalletAddress[]>;
  signPsbt: () => Promise<void>;
  signMessage: () => Promise<void>;
}

export type WalletAddress = {
  pub: string;
  address: string;
  format: AddressFormats;
};
