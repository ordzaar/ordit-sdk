import bigInt from "big-integer";
import { opcodes, script } from "bitcoinjs-lib";

import { OrditSDKError } from "../errors";
import { pushValue, pushValues } from "./helper";
import { Edict, Etching, FlagEnum, Rune, RUNE_NAME, TagEnum } from "./types";

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

// This runestone format and calculation based on ord server 0.16.0
// https://github.com/ordinals/ord/blob/0.16.0/src/runes/runestone.rs#L51
// EXPERIMENTAL ONLY
export class Runestone {
  public burn?: boolean;

  public claim?: bigint;

  public default_output?: number;

  public edicts: Edict[] = [];

  public etching?: Etching;

  constructor(rune: Rune) {
    this.burn = rune.burn;
    this.claim = rune.claim;
    this.default_output = rune.default_output;
    this.edicts = rune.edicts;
    this.etching = rune.etching;
  }

  public encipher() {
    const ops: number[] = [];

    if (this.etching) {
      const flag = new Flag(BigInt(0));
      flag.set(FlagEnum.Etch);
      if (this.etching.mint) {
        flag.set(FlagEnum.Mint);
      }
      pushValues(ops, BigInt(TagEnum.Flags), flag.value);

      if (this.etching.rune) {
        pushValues(ops, BigInt(TagEnum.Rune), this.etching.rune);
      }

      if (this.etching.divisibility) {
        if (this.etching.divisibility > 38) {
          throw new OrditSDKError("Divisibility should be less than 38");
        }
        pushValues(
          ops,
          BigInt(TagEnum.Divisibility),
          BigInt(this.etching.divisibility),
        );
      }

      if (this.etching.spacers) {
        if (this.etching.spacers > 134217727) {
          throw new OrditSDKError("Divisibility should be less than 134217727");
        }
        pushValues(ops, BigInt(TagEnum.Spacers), BigInt(this.etching.spacers));
      }

      if (this.etching.symbol) {
        const symbol = Buffer.from(this.etching.symbol, "utf8");
        if (symbol.length !== 1) {
          throw new OrditSDKError("Symbol should be just 1 character");
        }
        pushValues(ops, BigInt(TagEnum.Symbol), BigInt(symbol[0]));
      }

      if (this.etching.mint) {
        if (this.etching.mint.deadline) {
          pushValues(
            ops,
            BigInt(TagEnum.Deadline),
            BigInt(this.etching.mint.deadline),
          );
        }

        if (this.etching.mint.limit) {
          if (this.etching.mint.limit > BigInt("18446744073709551616")) {
            throw new OrditSDKError(
              "Mint limit should be less than 18446744073709551616",
            );
          }
          pushValues(ops, BigInt(TagEnum.Limit), this.etching.mint.limit);
        }

        if (this.etching.mint.term) {
          pushValues(ops, BigInt(TagEnum.Term), BigInt(this.etching.mint.term));
        }
      }
    }

    if (this.claim) {
      pushValues(ops, BigInt(TagEnum.Claim), this.claim);
    }

    if (this.default_output) {
      pushValues(
        ops,
        BigInt(TagEnum.DefaultOutput),
        BigInt(this.default_output),
      );
    }

    if (this.burn) {
      pushValues(ops, BigInt(TagEnum.Burn), BigInt(0));
    }

    if (this.edicts.length > 0) {
      pushValue(ops, BigInt(TagEnum.Body));

      // sort edicts data by id
      this.edicts = this.edicts.sort((a, b) => {
        if (a.id > b.id) {
          return 1;
        }
        if (a.id < b.id) {
          return -1;
        }
        return 0;
      });

      // this is used for compressing the id,
      // since the id already sorted then try to reducing the next id value
      let id = BigInt(0);
      for (let i = 0; i < this.edicts.length; i += 1) {
        pushValue(ops, this.edicts[i].id - id);
        pushValue(ops, this.edicts[i].amount);
        pushValue(ops, this.edicts[i].output);

        id = this.edicts[i].id;
      }
    }

    const final = [
      opcodes.OP_RETURN,
      Buffer.from(RUNE_NAME, "utf8"),
      Buffer.from(ops),
    ];

    return script.compile(final);
  }
}
