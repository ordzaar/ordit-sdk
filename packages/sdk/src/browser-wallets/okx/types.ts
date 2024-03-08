import { BrowserWalletNetwork } from "../../config/types";
import { InputsToSign } from "../../inscription/types";

export type OKXSignPSBTOptions = {
  finalize?: boolean;
  extractTx?: boolean;
  network: BrowserWalletNetwork;
  inputsToSign: InputsToSign[];
};
