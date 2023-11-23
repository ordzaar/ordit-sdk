import type { BrowserWalletNetwork } from "../../config/types";
import { InputsToSign } from "../../inscription/types";

export type XverseNetwork = "Mainnet" | "Testnet";

export type XverseSignPSBTOptions = {
  finalize?: boolean;
  extractTx?: boolean;
  network: BrowserWalletNetwork;
  inputsToSign: InputsToSign[];
};
