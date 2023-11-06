import { BitcoinNetworkType } from "sats-connect";

import { BrowserWalletNetwork } from "../../config/types";

export function fromXOnlyToFullPubkey(xOnly: string): string {
  return `03${xOnly}`; // prepend y-coord/tie-breaker to x-only
}
