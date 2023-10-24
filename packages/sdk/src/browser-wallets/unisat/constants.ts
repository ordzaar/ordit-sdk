import type { Network } from "../../networks/types";

export const NETWORK_TO_UNISAT_NETWORK: Record<Network, UnisatNetwork | ""> = {
  mainnet: "livenet",
  testnet: "testnet",
  regtest: "", // Unsupported by Unisat
} as const;
