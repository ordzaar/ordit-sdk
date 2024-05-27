import { BitcoinNetworkType } from "sats-connect";

import type { BrowserWalletNetwork } from "../../../config/types";

export const NETWORK_TO_BITCOIN_NETWORK_TYPE: Record<
  Extract<BrowserWalletNetwork, "mainnet" | "testnet">,
  BitcoinNetworkType
> = {
  mainnet: BitcoinNetworkType.Mainnet,
  testnet: BitcoinNetworkType.Testnet,
} as const;
