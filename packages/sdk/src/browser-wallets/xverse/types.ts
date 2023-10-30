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
