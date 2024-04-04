import type { Payment } from "bitcoinjs-lib";
import type { Buffer } from "buffer";

import type { AddressFormat, AddressType } from "../addresses/types";

export interface NestedObject {
  [key: string]: NestedObject | unknown;
}

export interface EncodeDecodeObjectOptions {
  encode: boolean;
  depth?: number;
}

export type RequireAtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> &
    Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];

interface BaseDataFormat {
  hex?: string;
  base64?: string;
  buffer?: Buffer;
}

export type OneOfAllDataFormats = RequireAtLeastOne<BaseDataFormat>;
export type BufferOrHex = RequireAtLeastOne<
  Pick<BaseDataFormat, "buffer" | "hex">
>;

export interface IsBitcoinPaymentResponse {
  type: AddressType;
  payload: false | Payment | (number | Buffer)[];
}

export interface GetScriptTypeResponse extends IsBitcoinPaymentResponse {
  format: AddressFormat;
}
