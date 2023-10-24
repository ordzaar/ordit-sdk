export const ADDRESS_TYPE_TO_NAME = {
  p2pkh: "legacy",
  p2sh: "nested-segwit",
  p2wpkh: "segwit",
  p2tr: "taproot",
} as const;

export const ADDRESS_NAME_TO_TYPE = {
  legacy: "p2pkh",
  "nested-segwit": "p2sh",
  segwit: "p2wpkh",
  taproot: "p2tr",
} as const;

export type AddressTypes = keyof typeof ADDRESS_TYPE_TO_NAME;
export type AddressFormats =
  | (typeof ADDRESS_TYPE_TO_NAME)[AddressTypes]
  | "unknown";

export const ADDRESS_FORMATS = {
  mainnet: {
    p2pkh: /^[1][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
    p2sh: /^[3][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
    p2wpkh: /^(bc1[qp])[a-zA-HJ-NP-Z0-9]{14,74}$/,
    p2tr: /^(bc1p)[a-zA-HJ-NP-Z0-9]{14,74}$/,
  },
  testnet: {
    p2pkh: /^[mn][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
    p2sh: /^[2][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
    p2wpkh: /^(tb1[qp]|bcrt1[qp])[a-zA-HJ-NP-Z0-9]{14,74}$/,
    p2tr: /^(tb1p|bcrt1p)[a-zA-HJ-NP-Z0-9]{14,74}$/,
  },
  regtest: {
    p2pkh: /^[mn][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
    p2sh: /^[2][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
    p2wpkh: /^(tb1[qp]|bcrt1[qp])[a-zA-HJ-NP-Z0-9]{14,74}$/,
    p2tr: /^(tb1p|bcrt1p)[a-zA-HJ-NP-Z0-9]{14,74}$/,
  },
} as const;
