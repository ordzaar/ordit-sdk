import { invert } from "./helper";
import type { AddressType, AddressFormat } from "./types";

export const ADDRESS_TYPE_TO_FORMAT: Record<AddressType, AddressFormat> = {
  p2pkh: "legacy",
  p2sh: "nested-segwit",
  p2wpkh: "segwit",
  p2tr: "taproot",
} as const;

export const ADDRESS_FORMAT_TO_TYPE: Record<AddressFormat, AddressType> =
  invert(ADDRESS_TYPE_TO_FORMAT);
