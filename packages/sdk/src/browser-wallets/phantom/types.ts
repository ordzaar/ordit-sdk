import { BrowserWalletNetwork } from "../../config/types";
import { InputsToSign } from "../../inscription/types";

export type PhantomSignPSBTOptions = {
  finalize?: boolean;
  extractTx?: boolean;
  network: BrowserWalletNetwork;
  inputsToSign: InputsToSign[];
};
