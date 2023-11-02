export class BrowserWalletSigningError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrowserWalletSigningError";
  }
}
