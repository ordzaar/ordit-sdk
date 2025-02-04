import { BrowserWalletNetwork } from "../../config/types";
import { InputsToSign } from "../../inscription/types";

export type OylSignPSBTOptions = {
  finalize?: boolean;
  extractTx?: boolean;
  network: BrowserWalletNetwork;
};
