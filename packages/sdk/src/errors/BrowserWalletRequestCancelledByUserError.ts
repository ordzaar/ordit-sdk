export class BrowserWalletRequestCancelledByUserError extends Error {
  constructor(message: string = "Request canceled by user.") {
    super(message);
    this.name = "BrowserWalletRequestCancelledByUserError";
  }
}
