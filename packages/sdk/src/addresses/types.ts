export type AddressType = "p2pkh" | "p2sh" | "p2wpkh" | "p2tr";

export type AddressFormat =
  | "legacy"
  | "nested-segwit"
  | "segwit"
  | "taproot"
  | "unknown";
