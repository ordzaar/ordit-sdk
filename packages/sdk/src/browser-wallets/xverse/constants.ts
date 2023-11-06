import type { BrowserWalletNetwork } from "../../config/types";
import type { BitcoinNetworkType } from "sats-connect";

export const NETWORK_TO_BITCOIN_NETWORK_TYPE: Record<
  BrowserWalletNetwork,
  BitcoinNetworkType
> = {
  mainnet: BitcoinNetworkType.Mainnet,
  testnet: BitcoinNetworkType.Testnet,
} as const;
