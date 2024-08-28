import { AddressFormat, AddressType } from "../addresses";
import { Network } from "../config/types";

export type OnOffUnion = "on" | "off";

export type GetWalletOptions = {
  pubKey: string;
  network: Network;
  format: AddressType | "all";
  safeMode?: OnOffUnion;
};

export interface DerivationIndex {
  accountIndex: number;
  addressIndex: number;
}

export type SigningMessageOptions = Partial<DerivationIndex>;

export type WalletOptions = {
  wif?: string;
  seed?: string;
  privateKey?: string;
  bip39?: string;
  network?: Network;
  format?: AddressFormat;
  account?: number;
  addressIndex?: number;
};
