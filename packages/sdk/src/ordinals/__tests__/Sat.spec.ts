import { Sat } from "../Sat";
import { SAT_SUPPLY } from "../constants";

describe("Sat", () => {
  describe("constructor", () => {
    test("Should return correct n", () => {
      const n = 1152182500000000;
      const s = new Sat(n);
      expect(s.n).toStrictEqual(n);
    });
    test("Should throw error on sat out of range", () => {
      expect(() => new Sat(-1)).toThrowError("sat out of range");
      expect(() => new Sat(SAT_SUPPLY + 1)).toThrowError("sat out of range");
    });
  });

  describe("fromName", () => {
    test("Should throw error if name contains numeric", () => {
      expect(() => Sat.fromName("asdas2")).toThrowError(
        "invalid character in sat name: 2",
      );
      expect(() => Sat.fromName("3soepsos")).toThrowError(
        "invalid character in sat name: 3",
      );
    });
    test("Should throw error if name exceeds sats supply", () => {
      // highest name = nvtdijuwxlp => sat 0
      expect(() => Sat.fromName("nvtdijuwxlz")).toThrowError(
        "sat name out of range",
      );
      expect(() => Sat.fromName("zzzzzzzzzzzz")).toThrowError(
        "sat name out of range",
      );
    });
    test("Should successfully return sat from valid name", () => {
      expect(Sat.fromName("frnsxuwniyb").n).toStrictEqual(
        1_152_182_500_000_000,
      );
      expect(Sat.fromName("a").n).toStrictEqual(SAT_SUPPLY - 1);
      expect(Sat.fromName("b").n).toStrictEqual(SAT_SUPPLY - 2);
      expect(Sat.fromName("aa").n).toStrictEqual(SAT_SUPPLY - 27);
    });
  });

  describe("height", () => {
    test("Should successfully return height", () => {
      expect(new Sat(0).height.n).toStrictEqual(0);
      expect(new Sat(1).height.n).toStrictEqual(0);
      expect(new Sat(1_152_182_500_000_000).height.n).toStrictEqual(250_873);
      expect(new Sat(SAT_SUPPLY - 1).height.n).toStrictEqual(6_929_999);
      expect(new Sat(SAT_SUPPLY - 2).height.n).toStrictEqual(6_929_998);
    });
  });

  describe("cycle", () => {
    test("Should successfully return cycle", () => {
      expect(new Sat(0).cycle).toStrictEqual(0);
      expect(new Sat(1).cycle).toStrictEqual(0);
      expect(new Sat(1_152_182_500_000_000).cycle).toStrictEqual(0);
      expect(new Sat(2_092_182_500_000_000).cycle).toStrictEqual(1);
      expect(new Sat(SAT_SUPPLY - 1).cycle).toStrictEqual(5);
      expect(new Sat(SAT_SUPPLY - 2).cycle).toStrictEqual(5);
    });
  });

  describe("percentile", () => {
    test("Should successfully return percentile", () => {
      expect(new Sat(0).percentile).toStrictEqual("0%");
      expect(new Sat(1).percentile).toStrictEqual("4.7619047671428595e-14%");
      expect(new Sat(1_152_182_500_000_000).percentile).toStrictEqual(
        "54.86583339368578%",
      );
      expect(new Sat(SAT_SUPPLY - 1).percentile).toStrictEqual("100%");
      expect(new Sat(SAT_SUPPLY - 2).percentile).toStrictEqual(
        "99.99999999999996%",
      );
    });
  });

  describe("degree", () => {
    test("Should successfully return degree", () => {
      expect(new Sat(0).degree.toString()).toStrictEqual("0°0′0″0‴");
      expect(new Sat(1).degree.toString()).toStrictEqual("0°0′0″1‴");
      expect(
        new Sat(2_067_187_500_000_000 - 1).degree.toString(),
      ).toStrictEqual("0°209999′2015″156249999‴");
      expect(new Sat(2_067_187_500_000_000).degree.toString()).toStrictEqual(
        "1°0′0″0‴",
      );
      expect(
        new Sat(2_067_187_500_000_000 + 1).degree.toString(),
      ).toStrictEqual("1°0′0″1‴");
      expect(new Sat(1_152_182_500_000_000).degree.toString()).toStrictEqual(
        "0°40873′889″0‴",
      );
      expect(new Sat(SAT_SUPPLY - 1).degree.toString()).toStrictEqual(
        "5°209999′1007″0‴",
      );
      expect(new Sat(SAT_SUPPLY - 2).degree.toString()).toStrictEqual(
        "5°209998′1006″0‴",
      );
    });
  });

  describe("third", () => {
    test("Should successfully return third", () => {
      expect(new Sat(0).third).toStrictEqual(0);
      expect(new Sat(1).third).toStrictEqual(1);
      expect(new Sat(2_067_187_500_000_000 - 1).third).toStrictEqual(156249999);
      expect(new Sat(2_067_187_500_000_000).third).toStrictEqual(0);
      expect(new Sat(2_067_187_500_000_000 + 1).third).toStrictEqual(1);
      expect(new Sat(SAT_SUPPLY - 1).third).toStrictEqual(0);
      expect(new Sat(SAT_SUPPLY - 2).third).toStrictEqual(0);
    });
  });

  describe("epoch", () => {
    test("Should successfully return epoch", () => {
      expect(new Sat(0).epoch.n).toStrictEqual(0);
      expect(new Sat(1).epoch.n).toStrictEqual(0);
      expect(new Sat(2_067_187_500_000_000 - 1).epoch.n).toStrictEqual(5);
      expect(new Sat(2_067_187_500_000_000).epoch.n).toStrictEqual(6);
      expect(new Sat(2_067_187_500_000_000 + 1).epoch.n).toStrictEqual(6);
      expect(new Sat(SAT_SUPPLY - 1).epoch.n).toStrictEqual(32);
      expect(new Sat(SAT_SUPPLY - 2).epoch.n).toStrictEqual(32);
    });
  });

  describe("period", () => {
    test("Should successfully return period", () => {
      expect(new Sat(0).period).toStrictEqual(0);
      expect(new Sat(1).period).toStrictEqual(0);
      expect(new Sat(2_067_187_500_000_000 - 1).period).toStrictEqual(624);
      expect(new Sat(2_067_187_500_000_000).period).toStrictEqual(625);
      expect(new Sat(2_067_187_500_000_000 + 1).period).toStrictEqual(625);
      expect(new Sat(SAT_SUPPLY - 1).period).toStrictEqual(3437);
      expect(new Sat(SAT_SUPPLY - 2).period).toStrictEqual(3437);
    });
  });

  describe("rarity", () => {
    test("Should successfully return rarity", () => {
      expect(new Sat(0).rarity.toString()).toStrictEqual("mythic");
      expect(new Sat(1).rarity.toString()).toStrictEqual("common");
      expect(
        new Sat(2_067_187_500_000_000 - 1).rarity.toString(),
      ).toStrictEqual("common");
      expect(new Sat(2_067_187_500_000_000).rarity.toString()).toStrictEqual(
        "legendary",
      );
      expect(
        new Sat(2_067_187_500_000_000 + 1).rarity.toString(),
      ).toStrictEqual("common");
      expect(new Sat(SAT_SUPPLY - 1).rarity.toString()).toStrictEqual(
        "uncommon",
      );
      expect(new Sat(SAT_SUPPLY - 2).rarity.toString()).toStrictEqual(
        "uncommon",
      );
    });
  });

  describe("epochPosition", () => {
    test("Should successfully return epochPosition", () => {
      expect(new Sat(0).epochPosition).toStrictEqual(0);
      expect(new Sat(1).epochPosition).toStrictEqual(1);
      expect(new Sat(2_067_187_500_000_000 - 1).epochPosition).toStrictEqual(
        32812499999999,
      );
      expect(new Sat(2_067_187_500_000_000).epochPosition).toStrictEqual(0);
      expect(new Sat(2_067_187_500_000_000 + 1).epochPosition).toStrictEqual(1);
      expect(new Sat(SAT_SUPPLY - 1).epochPosition).toStrictEqual(209999);
      expect(new Sat(SAT_SUPPLY - 2).epochPosition).toStrictEqual(209998);
    });
  });

  describe("decimal", () => {
    test("Should successfully return decimal", () => {
      expect(new Sat(0).decimal.toString()).toStrictEqual("0.0");
      expect(new Sat(1).decimal.toString()).toStrictEqual("0.1");
      expect(
        new Sat(2_067_187_500_000_000 - 1).decimal.toString(),
      ).toStrictEqual("1259999.156249999");
      expect(new Sat(2_067_187_500_000_000).decimal.toString()).toStrictEqual(
        "1260000.0",
      );
      expect(
        new Sat(2_067_187_500_000_000 + 1).decimal.toString(),
      ).toStrictEqual("1260000.1");
      expect(new Sat(SAT_SUPPLY - 1).decimal.toString()).toStrictEqual(
        "6929999.0",
      );
      expect(new Sat(SAT_SUPPLY - 2).decimal.toString()).toStrictEqual(
        "6929998.0",
      );
    });
  });

  describe("name", () => {
    test("Should successfully return name", () => {
      expect(new Sat(0).name).toStrictEqual("nvtdijuwxlp");
      expect(new Sat(1).name).toStrictEqual("nvtdijuwxlo");
      expect(new Sat(2_067_187_500_000_000 - 1).name).toStrictEqual(
        "fachfvytgc",
      );
      expect(new Sat(2_067_187_500_000_000).name).toStrictEqual("fachfvytgb");
      expect(new Sat(2_067_187_500_000_000 + 1).name).toStrictEqual(
        "fachfvytga",
      );
      expect(new Sat(SAT_SUPPLY - 1).name).toStrictEqual("a");
      expect(new Sat(SAT_SUPPLY - 2).name).toStrictEqual("b");
    });
  });
});
