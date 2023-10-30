export class OrditSDKError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrditSDKError";
  }
}

export class BrowserWalletNotInstalledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrowserWalletNotInstalledError";
  }
}

export class BrowserWalletSigningError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrowserWalletSigningError";
  }
}
