import { BitcoinNetworkType } from "sats-connect";

import { BrowserWalletNetwork } from "../../config/types";

export function fromXOnlyToFullPubkey(xOnly: string): string {
  return `03${xOnly}`; // prepend y-coord/tie-breaker to x-only
}

export function fromBrowserWalletNetworkToBitcoinNetworkType(
  network: BrowserWalletNetwork,
): BitcoinNetworkType {
  const networkMap: Record<BrowserWalletNetwork, BitcoinNetworkType> = {
    mainnet: BitcoinNetworkType.Mainnet,
    testnet: BitcoinNetworkType.Testnet,
  };
  return networkMap[network];
}
