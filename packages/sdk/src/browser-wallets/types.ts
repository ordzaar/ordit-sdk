export interface BrowserWallet {
  isInstalled: () => Promise<boolean>;
  getAddresses: () => Promise<void>;
  signPsbt: () => Promise<void>;
  signMessage: () => Promise<void>;
}
