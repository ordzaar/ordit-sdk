import { BIP32Interface } from "bip32";

import { Network } from "../config/types";

export type AddressType = "p2pkh" | "p2sh" | "p2wsh" | "p2wpkh" | "p2tr";
// "p2pkh" | "p2sh" | "p2wpkh" | "p2tr" | "all")

export type AddressFormat =
  | "legacy"
  | "p2sh-p2wpkh"
  | "p2wsh"
  | "segwit"
  | "taproot";

export type Address = {
  /**
   * Address
   */
  address: string;

  /**
   * Address format
   */
  format: AddressFormat;

  /**
   * Public key
   */
  publicKey: string;

  /**
   * x-coordinate of the public key, when taproot is used
   */
  xKey?: string;
  derivationPath?: Derivation;
};

export type Account = Address & {
  priv: string;
  type: AddressType;
  child: BIP32Interface;
};

export type Derivation = {
  account: number;
  addressIndex: number;
  path: string;
};

export type GetAccountDataFromHdNodeOptions = {
  hdNode: BIP32Interface;
  format?: AddressFormat;
  network?: Network;
  account?: number;
  addressIndex?: number;
};

export type GetAllAccountsFromHDNodeOptions = Omit<
  GetAccountDataFromHdNodeOptions,
  "format"
>;
