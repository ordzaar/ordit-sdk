/* eslint-disable no-bitwise */

import { OrditSDKError } from "../errors";
import { Network } from "../transactions";
import {
  HALVING_INTERVAL,
  INTERVAL,
  MAX_STEP,
  RUNE_NUMBER_STEPS,
  RuneId,
} from "./types";

function firstRuneHeight(network: Network) {
  switch (network) {
    case "mainnet": {
      return 4n * HALVING_INTERVAL;
    }
    case "testnet": {
      return 12n * HALVING_INTERVAL;
    }
    case "regtest": {
      return 0n * HALVING_INTERVAL;
    }
    default:
      throw new OrditSDKError("Invalid network");
  }
}

// https://github.com/ordinals/ord/blob/0.17.0/crates/ordinals/src/rune.rs#L57
export function runeNumberMinimumHeight(
  network: Network,
  currentHeight: bigint,
) {
  // next block height
  const offset = currentHeight + 1n;

  const startHeight = firstRuneHeight(network);
  const endHeight = startHeight + HALVING_INTERVAL;

  if (offset < startHeight) {
    return RUNE_NUMBER_STEPS[Number(MAX_STEP)];
  }

  if (offset >= endHeight) {
    return 0n;
  }

  // how many blocks from the halving
  const progress = offset - startHeight;
  const length = 12n - progress / INTERVAL;

  // select the end & start from the steps
  const end = RUNE_NUMBER_STEPS[Number(length - 1n)];
  const start = RUNE_NUMBER_STEPS[Number(length)];

  const remainder = progress % INTERVAL;

  return start - ((start - end) * remainder) / INTERVAL;
}

// https://github.com/ordinals/ord/blob/0.17.0/crates/ordinals/src/spaced_rune.rs#L20
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

// https://github.com/ordinals/ord/blob/0.17.0/crates/ordinals/src/varint.rs
// Learn more about variable length integer: https://golb.hplar.ch/2019/06/variable-length-int-java.html
function encodeVarint(num: bigint) {
  if (num < 0) {
    throw new OrditSDKError("Number must not be negative");
  }
  if (num >= 1n << 128n) {
    throw new OrditSDKError(`Number must be less than ${1n << 128n}`);
  }

  const arr = [];
  while (num >> 7n > 0) {
    arr.push(Number((num & 0b11111111n) | 0b10000000n));
    // eslint-disable-next-line no-param-reassign
    num >>= 7n;
  }
  arr.push(Number(num));

  return Buffer.from(arr);
}

// https://github.com/ordinals/ord/blob/0.17.0/crates/ordinals/src/rune.rs#L142
export function parseRuneStrToNumber(runeStr: string) {
  let runeNumber = 0n;
  for (let i = 0; i < runeStr.length; i += 1) {
    const c = runeStr.charAt(i);
    if (i > 0) {
      runeNumber += 1n;
    }
    runeNumber *= 26n;
    if (c >= "A" && c <= "Z") {
      runeNumber += BigInt(c.charCodeAt(0) - "A".charCodeAt(0));
    } else {
      throw new OrditSDKError(`Invalid character in rune name: ${c}`);
    }
  }
  return BigInt(runeNumber.toString());
}

// create buffer from bigint
export function bigintToBuffer(runeNumber: bigint) {
  const arr = [];
  while (runeNumber >> 8n > 0) {
    arr.push(Number(runeNumber & 0b11111111n));
    // eslint-disable-next-line no-param-reassign
    runeNumber >>= 8n;
  }
  arr.push(Number(runeNumber));
  return Buffer.from(arr);
}

export function runeIdFromStr(runeIdStr: string): RuneId {
  const [block, tx] = runeIdStr.split(":");

  return {
    block: BigInt(block),
    tx: parseInt(tx, 10),
  };
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
