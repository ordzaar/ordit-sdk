import { BrowserWalletNetwork } from "../../config/types";

export type OylSignPSBTOptions = {
  finalize?: boolean;
  extractTx?: boolean;
  network: BrowserWalletNetwork;
};
