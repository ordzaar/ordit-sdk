export type Network = "mainnet" | "testnet" | "regtest";

export type BrowserWalletNetwork = Extract<Network, "mainnet" | "testnet">;
