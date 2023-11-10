export type AddressType = "p2pkh" | "p2sh" | "p2wpkh" | "p2tr";

export type AddressFormat = "legacy" | "p2sh-p2wpkh" | "segwit" | "taproot";

export type Address = {
  address: string;
  xKey?: string;
  format: AddressFormat;
  publicKey: string;
};
