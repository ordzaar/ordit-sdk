export type AddressType = "p2pkh" | "p2sh" | "p2wsh" | "p2wpkh" | "p2tr";

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
};
