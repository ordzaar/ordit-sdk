import bigInt from "big-integer";
import { opcodes, script } from "bitcoinjs-lib";

import { OrditSDKError } from "../errors";
import { bigintToBuffer, pushValue, pushValues } from "./helper";
import {
  Edict,
  Etching,
  FlagEnum,
  Rune,
  RUNE_OP_CODE,
  RuneId,
  TagEnum,
} from "./types";

export class Flag {
  public flag: bigint;

  constructor(flag: bigint) {
    this.flag = flag;
  }

  public set(flagValue: FlagEnum) {
    // eslint-disable-next-line no-bitwise
    const mask = 1 << flagValue;
    // eslint-disable-next-line no-bitwise
    this.flag = BigInt(bigInt(this.flag).or(bigInt(mask)).toString());
  }

  get value() {
    return this.flag;
  }
}

// EXPERIMENTAL ONLY
// This runestone format and calculation based on ord server 0.17.0
// https://github.com/ordinals/ord/blob/0.17.0/crates/ordinals/src/runestone.rs#L128
// TODO refactor
// more validation validation:
// - max/min value, please refer to ord server original type for each values (max of u128, u32 etc..)
// - max script size
// - etc.
export class Runestone {
  public pointer?: number;

  public mint?: RuneId;

  public edicts: Edict[] = [];

  public etching?: Etching;

  constructor(rune: Rune) {
    this.pointer = rune.pointer;
    this.mint = rune.mint;
    this.edicts = rune.edicts;
    this.etching = rune.etching;
  }

  public encipher() {
    const ops: number[] = [];

    if (this.etching !== undefined) {
      const flag = new Flag(BigInt(0));
      flag.set(FlagEnum.Etching);
      if (this.etching.terms !== undefined) {
        flag.set(FlagEnum.Terms);
      }
      pushValues(ops, BigInt(TagEnum.Flags), flag.value);

      if (this.etching.rune !== undefined) {
        pushValues(ops, BigInt(TagEnum.Rune), this.etching.rune);
      }

      if (this.etching.divisibility !== undefined) {
        if (this.etching.divisibility > 38) {
          throw new OrditSDKError("Divisibility must be less than or equal 38");
        }
        pushValues(
          ops,
          BigInt(TagEnum.Divisibility),
          BigInt(this.etching.divisibility),
        );
      }

      if (this.etching.spacers !== undefined) {
        if (this.etching.spacers > 134217727) {
          throw new OrditSDKError(
            "Spacers must be less than or equal 134217728",
          );
        }
        pushValues(ops, BigInt(TagEnum.Spacers), BigInt(this.etching.spacers));
      }

      if (this.etching.premine !== undefined) {
        if (this.etching.spacers <= 0) {
          throw new OrditSDKError("Premine must be greater than zero");
        }
        pushValues(ops, BigInt(TagEnum.Premine), BigInt(this.etching.premine));
      }

      if (this.etching.symbol !== undefined) {
        const symbol = Buffer.from(this.etching.symbol, "utf8");
        if (symbol.length !== 1) {
          throw new OrditSDKError("Symbol must be just 1 character");
        }
        pushValues(ops, BigInt(TagEnum.Symbol), BigInt(symbol[0]));
      }

      if (this.etching.terms !== undefined) {
        if (this.etching.terms.amount !== undefined) {
          if (this.etching.terms.amount <= 0) {
            throw new OrditSDKError("Amount must be greater than zero");
          }
          pushValues(ops, BigInt(TagEnum.Amount), this.etching.terms.amount);
        }
        if (this.etching.terms.cap !== undefined) {
          if (this.etching.terms.cap <= 0) {
            throw new OrditSDKError("Premine must be greater than zero");
          }
          pushValues(ops, BigInt(TagEnum.Cap), this.etching.terms.cap);
        }
        if (this.etching.terms.height?.start !== undefined) {
          pushValues(
            ops,
            BigInt(TagEnum.HeightStart),
            this.etching.terms.height.start,
          );
        }
        if (this.etching.terms.height?.end !== undefined) {
          pushValues(
            ops,
            BigInt(TagEnum.HeightEnd),
            this.etching.terms.height.end,
          );
        }
        if (this.etching.terms.offset?.start !== undefined) {
          pushValues(
            ops,
            BigInt(TagEnum.OffsetStart),
            this.etching.terms.offset.start,
          );
        }
        if (this.etching.terms.offset?.end !== undefined) {
          pushValues(
            ops,
            BigInt(TagEnum.OffsetEnd),
            this.etching.terms.offset.end,
          );
        }
      }
    }

    if (this.pointer !== undefined) {
      pushValues(ops, BigInt(TagEnum.Pointer), BigInt(this.pointer));
    }

    if (this.mint !== undefined) {
      pushValues(ops, BigInt(TagEnum.Mint), this.mint.block);
      pushValues(ops, BigInt(TagEnum.Mint), BigInt(this.mint.tx));
    }

    if (this.edicts.length > 0) {
      pushValue(ops, BigInt(TagEnum.Body));

      this.edicts.sort((a, b) => {
        // only sort on block if not identical
        if (a.id.block < b.id.block) return -1;
        if (a.id.block > b.id.block) return 1;

        // sort on tx
        if (a.id.tx < b.id.tx) return -1;
        if (a.id.tx > b.id.tx) return 1;
        // both idential, return 0
        return 0;
      });

      // this is for compressing the rune id,
      // since the id already sorted then try to reducing the next id based on delta value
      let deltaId: RuneId = {
        block: 0n,
        tx: 0,
      };
      for (let i = 0; i < this.edicts.length; i += 1) {
        const idBlock = this.edicts[i].id.block - deltaId.block;
        let idTx = this.edicts[i].id.tx;
        if (idBlock === 0n) {
          idTx -= deltaId.tx;
        }

        pushValue(ops, idBlock);
        pushValue(ops, BigInt(idTx));
        pushValue(ops, this.edicts[i].amount);
        pushValue(ops, this.edicts[i].output);

        deltaId = this.edicts[i].id;
      }
    }

    const final = [opcodes.OP_RETURN, RUNE_OP_CODE, Buffer.from(ops)];

    // TODO: validate maximum buffer script length
    return script.compile(final);
  }

  commitBuffer() {
    if (this.etching?.rune) {
      return bigintToBuffer(this.etching?.rune);
    }

    return null;
  }
}
