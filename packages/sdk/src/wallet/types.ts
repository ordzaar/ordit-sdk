import type { AddressType } from "../addresses/types";
import type { Network } from "../config/types";

export type OnOffUnion = "on" | "off";

export type GetWalletOptions = {
  pubKey: string;
  network: Network;
  format: AddressType | "all";
  safeMode?: OnOffUnion;
};
