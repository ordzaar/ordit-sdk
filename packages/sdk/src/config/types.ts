export type Network = "mainnet" | "testnet" | "regtest" | "signet";

export type BrowserWalletNetwork = Extract<
  Network,
  "mainnet" | "testnet" | "signet"
>;

export type Chain = "bitcoin" | "fractal-bitcoin";
