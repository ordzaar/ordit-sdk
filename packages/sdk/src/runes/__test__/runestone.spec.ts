import { getRuneSpacer, runeStrToNumber } from "../helper";
import { Runestone } from "../runestone";

// the expected values are generated from rust code (original ord server)
describe("Runestone", () => {
  test("should encode rune script", () => {
    const runeName = getRuneSpacer("ORDZAAR.MARKETPLACE");

    const rune = new Runestone({
      burn: true,
      claim: BigInt(19283712983),
      default_output: 1,
      edicts: [
        {
          id: BigInt(111111),
          amount: BigInt("9999782300756044170890651191062"),
          output: BigInt(1),
        },
        {
          id: BigInt(222222),
          amount: BigInt("9999782300756044170890651191062"),
          output: BigInt(1),
        },
        {
          id: BigInt(111111),
          amount: BigInt("9999782300756044170890651191062"),
          output: BigInt(1),
        },
      ],
      etching: {
        divisibility: 1,
        spacers: runeName.spacers,
        mint: {
          deadline: 1,
          limit: BigInt("18446744073709551616"),
          term: 100,
        },
        rune: runeStrToNumber(runeName.rune),
        symbol: "B",
      },
    });

    const encodedScript = rune.encipher().toString("hex");
    expect(encodedScript).toEqual(
      "6a0952554e455f544553544c66020304f4e4e8ea98c6baa8f6f48d160101034005420a010680fefefefefefefeff0008640ec6ea97b6570c017e000085e3079ec5efcfb18d9682b88bf79af48d1601009ec5efcfb18d9682b88bf79af48d160185e3079ec5efcfb18d9682b88bf79af48d1601",
    );
  });

  test("encode etching data only", () => {
    const runeName = getRuneSpacer("ORDZAAR.MARKETPLACE");
    const rune = new Runestone({
      burn: false,
      edicts: [],
      etching: {
        divisibility: 1,
        spacers: runeName.spacers,
        mint: {
          deadline: 1,
          limit: BigInt(1),
          term: 1,
        },
        rune: runeStrToNumber(runeName.rune),
        symbol: "B",
      },
    });

    const encodedScript = rune.encipher().toString("hex");
    expect(encodedScript).toEqual(
      "6a0952554e455f544553541b020304f4e4e8ea98c6baa8f6f48d160101034005420a0106010801",
    );
  });

  test("encode edicts data only", () => {
    const rune = new Runestone({
      burn: false,
      edicts: [
        {
          id: BigInt(1),
          amount: BigInt(11),
          output: BigInt(11),
        },
        {
          id: BigInt(1),
          amount: BigInt(11),
          output: BigInt(11),
        },
        {
          id: BigInt(5),
          amount: BigInt(55),
          output: BigInt(55),
        },
      ],
    });

    const encodedScript = rune.encipher().toString("hex");
    expect(encodedScript).toEqual(
      "6a0952554e455f544553540a00010b0b000b0b043737",
    );
  });

  test("encode edicts data only, single data", () => {
    const rune = new Runestone({
      burn: false,
      edicts: [
        {
          id: BigInt(1),
          amount: BigInt(11),
          output: BigInt(11),
        },
      ],
    });

    const encodedScript = rune.encipher().toString("hex");
    expect(encodedScript).toEqual("6a0952554e455f544553540400010b0b");
  });
});
