import type { BrowserWalletNetwork } from "../../config/types";

export const NETWORK_TO_UNISAT_NETWORK: Record<
  BrowserWalletNetwork,
  UnisatNetwork
> = {
  mainnet: "livenet",
  testnet: "testnet",
} as const;
