import { script, opcodes } from "bitcoinjs-lib";
import { Edict, Etching, FlagEnum, RUNE_NAME, Rune, TagEnum } from "./types";
import { pushValue, runeSpacer, runeStrToNumber } from "./helper";

export class Flag {
  public flag: number;

  constructor(flag: number) {
    this.flag = flag;
  }

  public set(flagValue: FlagEnum) {
    // eslint-disable-next-line no-bitwise
    const mask = 1 << flagValue;
    // eslint-disable-next-line no-bitwise
    this.flag |= mask;
  }

  get value() {
    return this.flag;
  }
}

export class Runestone {
  public burn?: boolean;

  public claim?: number;

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
      const flag = new Flag(0);
      flag.set(FlagEnum.Etch);
      if (this.etching.mint) {
        flag.set(FlagEnum.Mint);
      }
      pushValue(ops, TagEnum.Flags, flag.value);

      if (this.etching.rune) {
        pushValue(ops, TagEnum.Rune, this.etching.rune);
      }

      if (this.etching.divisibility) {
        pushValue(ops, TagEnum.Divisibility, this.etching.divisibility);
      }

      if (this.etching.spacers) {
        pushValue(ops, TagEnum.Spacers, this.etching.spacers);
      }

      if (this.etching.symbol) {
        const symbol = Buffer.from(this.etching.symbol, "utf8");
        if (symbol.length !== 1) {
          throw new Error("Symbol should be just 1 character");
        }
        pushValue(ops, TagEnum.Symbol, symbol[0]);
      }

      if (this.etching.mint) {
        if (this.etching.mint.deadline) {
          pushValue(ops, TagEnum.Deadline, this.etching.mint.deadline);
        }

        if (this.etching.mint.limit) {
          pushValue(ops, TagEnum.Limit, this.etching.mint.limit);
        }

        if (this.etching.mint.term) {
          pushValue(ops, TagEnum.Term, this.etching.mint.term);
        }
      }
    }

    // if (this.claim) {
    //   pushTag(ops, TagEnum.Claim, this.claim);
    // }

    if (this.default_output) {
      pushValue(ops, TagEnum.DefaultOutput, this.default_output);
    }

    if (this.burn) {
      pushValue(ops, TagEnum.Burn, 0);
    }

    const final = [
      opcodes.OP_RETURN,
      Buffer.from(RUNE_NAME, "utf8"),
      Buffer.from(ops),
    ];

    return script.compile(final).toString("hex");
  }
}

function main() {
  const runeName = runeSpacer("OR.DZ.A.AR.MARK");

  const rune = new Runestone({
    burn: false,
    // claim: 12,
    default_output: 1,
    edicts: [],
    etching: {
      divisibility: 1,
      spacers: runeName.spacers,
      mint: {
        deadline: 1,
        limit: 100,
        term: 1,
      },
      rune: runeStrToNumber(runeName.rune),
      symbol: "B",
    },
  });

  const result = rune.encipher();
  console.log(result);
}

main();
