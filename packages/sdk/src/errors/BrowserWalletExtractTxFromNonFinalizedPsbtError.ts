export class BrowserWalletExtractTxFromNonFinalizedPsbtError extends Error {
  constructor(
    message: string = "Cannot extract transaction from non-finalized psbt.",
  ) {
    super(message);
    this.name = "BrowserWalletExtractTxFromNonFinalizedPsbtError";
  }
}
