import { type } from "os";
import type { BrowserWalletNetwork } from "../../config/types";

export type XverseGetAddressOptions = {
  network: BrowserWalletNetwork;
  payload?: {
    message: string;
  };
};

export type XverseOnFinishResponse = {
  addresses: Array<{
    address: string;
    publicKey: string;
    purpose: "ordinals" | "payment";
  }>;
};

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

export type XverseSignPSBTResponse = {
  psbtBase64: string;
};
