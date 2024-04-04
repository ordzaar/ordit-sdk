import { parseRuneStrToNumber, parseToRuneSpacer } from "../helper";
import { Runestone } from "../runestone";

// the expected values are generated from rust code (original ord server)
describe("Runestone", () => {
  test("encode etching data only", () => {
    const runeName = parseToRuneSpacer("ORDZAAR.MARKETPLACE");
    const rune = new Runestone({
      pointer: 1,
      mint: {
        block: 1n,
        tx: 1,
      },
      edicts: [],
      etching: {
        divisibility: 1,
        premine: 10000000000000n,
        rune: parseRuneStrToNumber(runeName.runeStr),
        spacers: 10,
        symbol: "B",
        terms: {
          cap: 1000n,
          amount: 100n,
          height: {
            start: 100n,
            end: 200n,
          },
          offset: {
            start: 50n,
            end: 100n,
          },
        },
      },
    });

    const encodedScript = rune.encipher().toString("hex");
    expect(encodedScript).toEqual(
      "6a5d31020304968ef5f7a9bbc799ebe9e5750101030a0680c0caf384a30205420a6408e8070c640ec80110321264160114011401",
    );
  });

  test("encode edicts data only", () => {
    const rune = new Runestone({
      edicts: [
        {
          id: {
            block: 1n,
            tx: 1,
          },
          amount: 9999782300756044170890651191062n,
          output: 0n,
        },
        {
          id: {
            block: 1n,
            tx: 1,
          },
          amount: 9999782300756044170890651191062n,
          output: 1n,
        },
        {
          id: {
            block: 1n,
            tx: 1,
          },
          amount: 9999782300756044170890651191062n,
          output: 2n,
        },
      ],
    });

    const encodedScript = rune.encipher().toString("hex");
    expect(encodedScript).toEqual(
      "6a5d37000101968ef59bf88cb983978eb2d0f0c61f000000968ef59bf88cb983978eb2d0f0c61f010000968ef59bf88cb983978eb2d0f0c61f02",
    );
  });

  test("encode edicts data only, single data", () => {
    const rune = new Runestone({
      edicts: [
        {
          id: {
            block: 1n,
            tx: 1,
          },
          amount: 9999782300756044170890651191062n,
          output: 0n,
        },
      ],
    });

    const encodedScript = rune.encipher().toString("hex");
    expect(encodedScript).toEqual(
      "6a5d13000101968ef59bf88cb983978eb2d0f0c61f00",
    );
  });
});
