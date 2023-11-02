export class BrowserWalletNotInstalledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrowserWalletNotInstalledError";
  }
}
