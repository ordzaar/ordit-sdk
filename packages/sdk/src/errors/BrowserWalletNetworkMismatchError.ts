export class BrowserWalletNetworkMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrowserWalletNetworkMismatchError";
  }
}
