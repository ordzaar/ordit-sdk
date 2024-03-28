/* eslint-disable no-bitwise */

import bigInt from "big-integer";

import { OrditSDKError } from "../errors";

// https://github.com/ordinals/ord/blob/0.16.0/src/runes/rune_id.rs#L20
export function parseRuneIdToEdictId(id: string): number {
  const [height, index] = id.split(":");
  // eslint-disable-next-line
  const CLAIM_BIT = 1 << 48;

  return (parseInt(height, 10) << 16) | parseInt(index, 10) | CLAIM_BIT;
}

// https://github.com/ordinals/ord/blob/0.16.0/src/runes/spaced_rune.rs#L12
export function parseToRuneSpacer(rune: string) {
  let runeStr = "";
  let spacers = 0;

  // eslint-disable-next-line
  for (const c of rune) {
    if (/[A-Z]/.test(c)) {
      runeStr += c;
    } else if (c === "." || c === "•") {
      const flag = 1 << (runeStr.length - 1);

      if ((spacers & flag) !== 0) {
        throw new OrditSDKError("Double spacer");
      }

      spacers |= flag;
    } else {
      throw new OrditSDKError("Invalid spacer character");
    }
  }

  if (32 - Math.clz32(spacers) >= runeStr.length) {
    throw new OrditSDKError("Trailing spacer");
  }

  return { runeStr, spacers };
}

// https://github.com/ordinals/ord/blob/0.16.0/src/runes/varint.rs#L8
// Learn more about variable length integer: https://golb.hplar.ch/2019/06/variable-length-int-java.html
export function encodeVarint(n: bigint) {
  const out = Buffer.alloc(19);
  let i = 18;

  let nBig = bigInt(n);

  out[i] = nBig.and(0b0111_1111).toJSNumber();

  while (nBig.gt(0b0111_1111)) {
    nBig = nBig.divide(128).subtract(1);
    i -= 1;
    out[i] = nBig.and(0xff).or(0b1000_0000).toJSNumber();
  }

  return out.subarray(i);
}

// https://github.com/ordinals/ord/blob/0.16.0/src/runes/rune.rs#L125
export function parseRuneStrToNumber(runeStr: string) {
  let runeNumber = bigInt(0);
  for (let i = 0; i < runeStr.length; i += 1) {
    const c = runeStr.charAt(i);
    if (i > 0) {
      runeNumber = runeNumber.add(1);
    }
    runeNumber = runeNumber.multiply(26);
    if (c >= "A" && c <= "Z") {
      runeNumber = runeNumber.add(c.charCodeAt(0) - "A".charCodeAt(0));
    } else {
      throw new OrditSDKError(`Invalid character in rune name: ${c}`);
    }
  }
  return BigInt(runeNumber.toString());
}

export function pushValue(stacks: number[], value: bigint) {
  const encoded = encodeVarint(BigInt(value));
  for (let i = 0; i < encoded.length; i += 1) {
    stacks.push(encoded[i]);
  }
}

export function pushValues(stacks: number[], ...values: bigint[]) {
  for (let i = 0; i < values.length; i += 1) {
    pushValue(stacks, values[i]);
  }
}
