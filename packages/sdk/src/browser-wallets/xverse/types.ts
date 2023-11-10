import type { BrowserWalletNetwork } from "../../config/types";

export type XverseNetwork = "Mainnet" | "Testnet";

export type XverseSignPSBTOptions = {
  finalize?: boolean;
  extractTx?: boolean;
  network: BrowserWalletNetwork;
  inputsToSign: Array<{
    address: string;
    signingIndexes: number[];
  }>;
};
