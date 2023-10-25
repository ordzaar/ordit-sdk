export interface BrowserWallet {
  /**
   * Checks if the browser wallet extension is installed.
   *
   * @returns `true` if installed, `false` otherwise.
   */
  isInstalled: () => boolean;
  getAddresses: () => Promise<void>;
  signPsbt: () => Promise<void>;
  signMessage: () => Promise<void>;
}
