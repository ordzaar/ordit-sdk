export class BrowserWalletUserCancelledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrowserWallerUserCancelError";
  }
}
