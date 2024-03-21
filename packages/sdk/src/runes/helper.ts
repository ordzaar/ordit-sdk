/* eslint-disable no-bitwise */

import { TagEnum } from "./types";

// https://github.com/ordinals/ord/blob/0.16.0/src/runes/rune_id.rs#L20
export function getEdictIdFromRuneId(id: string): number {
  const [height, index] = id.split(":");
  // eslint-disable-next-line
  const CLAIM_BIT = 1 << 48;

  return (parseInt(height, 10) << 16) | parseInt(index, 10) | CLAIM_BIT;
}

// https://github.com/ordinals/ord/blob/0.16.0/src/runes/spaced_rune.rs#L12
export function runeSpacer(rune: string) {
  let pureRune = "";
  let spacers = 0;

  // eslint-disable-next-line
  for (const c of rune) {
    if (/[A-Z]/.test(c)) {
      pureRune += c;
    } else if (c === "." || c === "•") {
      const flag = 1 << (pureRune.length - 1);

      if ((spacers & flag) !== 0) {
        throw new Error("Double spacer");
      }

      spacers |= flag;
    } else {
      throw new Error("Invalid spacer character");
    }
  }

  if (32 - Math.clz32(spacers) >= pureRune.length) {
    throw new Error("Trailing spacer");
  }

  return { rune: pureRune, spacers };
}

// https://github.com/ordinals/ord/blob/0.16.0/src/runes/varint.rs#L8
// Learn more about variable length integer: https://golb.hplar.ch/2019/06/variable-length-int-java.html
// TODO: value should be support BigInt, need to modify varint function(tricky)
export function encodeVarint(n: number) {
  if (n > Number.MAX_SAFE_INTEGER) {
    throw new Error("Value is more than safe number");
  }

  const out = Buffer.alloc(19);
  let i = 18;

  out[i] = n & 0b0111_1111;

  while (n > 0b0111_1111) {
    // eslint-disable-next-line no-param-reassign
    n = Math.floor(n / 128) - 1;
    i -= 1;
    out[i] = (n & 0xff) | 0b1000_0000;
  }

  return out.subarray(i);
}

// https://github.com/ordinals/ord/blob/0.16.0/src/runes/rune.rs#L125
// TODO: value should be support BigInt, need to modify varint function(tricky)
export function runeStrToNumber(runeStr: string) {
  let charIdx = 0;
  for (let i = 0; i < runeStr.length; i += 1) {
    const c = runeStr.charAt(i);
    if (i > 0) {
      charIdx += 1;
    }
    charIdx *= 26;
    if (c >= "A" && c <= "Z") {
      charIdx += c.charCodeAt(0) - "A".charCodeAt(0);
    } else {
      throw new Error(`Invalid character in rune name: ${c}`);
    }
  }
  return charIdx;
}

export function pushValue(stacks: number[], tagEnum: TagEnum, value: number) {
  const encodedTagEnum = encodeVarint(tagEnum);
  for (let i = 0; i < encodedTagEnum.length; i += 1) {
    stacks.push(encodedTagEnum[i]);
  }
  const encodedValue = encodeVarint(value);
  for (let i = 0; i < encodedValue.length; i += 1) {
    stacks.push(encodedValue[i]);
  }
}
