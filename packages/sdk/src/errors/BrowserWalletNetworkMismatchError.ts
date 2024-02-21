export class BrowserWalletNetworkMismatchError extends Error {
  constructor(message: string = "Network mismatch") {
    super(message);
    this.name = "BrowserWalletNetworkMismatchError";
  }
}
