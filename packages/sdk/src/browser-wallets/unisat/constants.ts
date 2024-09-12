import type { BrowserWalletNetwork, Chain } from "../../config/types";

export const NETWORK_TO_UNISAT_NETWORK: Record<
  Extract<BrowserWalletNetwork, "mainnet" | "testnet">,
  UnisatNetwork
> = {
  mainnet: "livenet",
  testnet: "testnet",
} as const;

export const CHAIN_TO_UNISAT_CHAIN: Record<
  Chain,
  Record<Extract<BrowserWalletNetwork, "mainnet" | "testnet">, UnisatChainType>
> = {
  bitcoin: {
    mainnet: "BITCOIN_MAINNET",
    testnet: "BITCOIN_TESTNET",
  },
  "fractal-bitcoin": {
    mainnet: "FRACTAL_BITCOIN_MAINNET",
    testnet: "FRACTAL_BITCOIN_TESTNET",
  },
};
