export class BrowserWalletUserCancelledError extends Error {
  constructor(message: string = "Request canceled by user.") {
    super(message);
    this.name = "BrowserWalletUserCancelError";
  }
}
