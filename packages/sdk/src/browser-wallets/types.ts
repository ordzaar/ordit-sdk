import type { Psbt } from "bitcoinjs-lib";
import type { AddressFormat } from "../addresses/types";
import type { Network } from "../networks/types";

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

export interface BrowserWallet {
  /**
   * Checks if the browser wallet extension is installed.
   *
   * @returns `true` if installed, `false` otherwise.
   */
  isInstalled: () => boolean;

  /**
   * Gets addresses from the browser wallet.
   *
   * @param network Network
   * @returns An array of WalletAddress objects.
   */
  getAddresses: (network: Network) => Promise<WalletAddress[]>;

  /**
   * Signs a Partially Signed Bitcoin Transaction (PSBT).
   * To learn more, visit https://github.com/bitcoin/bitcoin/blob/master/doc/psbt.md
   *
   * @param psbt Partially Signed Bitcoin Transaction
   * @param options Options for signing
   * @returns An object containing `base64` and `hex` if the transaction is not extracted, or `hex` if the transaction is extracted.
   */
  signPsbt: (
    psbt: Psbt,
    options: BrowserWalletSignPSBTOptions,
  ) => Promise<BrowserWalletSignResponse>;

  /**
   * Signs a message.
   *
   * @param message Message to be signed
   * @returns An object containing `base64` and `hex`.
   */
  signMessage: (message: string) => Promise<BrowserWalletSignResponse>;
}
