import type { BrowserWalletNetwork } from "../../../config/types";
import { InputsToSign } from "../../../inscription/types";

export type SatsConnectNetwork = "Mainnet" | "Testnet" | "Signet";

export type SatsConnectSignPSBTOptions = {
  finalize?: boolean;
  extractTx?: boolean;
  network: BrowserWalletNetwork;
  inputsToSign: InputsToSign[];
};
