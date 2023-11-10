import {
  COIN_VALUE,
  DIFFCHANGE_INTERVAL,
  SUBSIDY_HALVING_INTERVAL,
} from "../constants";
import { Rarity } from "../Rarity";
import { Sat } from "../Sat";

describe("Rarity", () => {
  describe("from", () => {
    test("should return mythic", () => {
      expect(Rarity.from(new Sat(0)).toString()).toStrictEqual("mythic");
    });

    test("should return legendary", () => {
      expect(
        Rarity.from(new Sat(2_067_187_500_000_000)).toString(),
      ).toStrictEqual("legendary");
    });

    test("should return epic", () => {
      expect(
        Rarity.from(
          new Sat(50 * COIN_VALUE * SUBSIDY_HALVING_INTERVAL),
        ).toString(),
      ).toStrictEqual("epic");
    });

    test("should return rare", () => {
      expect(
        Rarity.from(new Sat(50 * COIN_VALUE * DIFFCHANGE_INTERVAL)).toString(),
      ).toStrictEqual("rare");
    });

    test("should return uncommon", () => {
      expect(Rarity.from(new Sat(50 * COIN_VALUE)).toString()).toStrictEqual(
        "uncommon",
      );
    });

    test("should return common", () => {
      expect(
        Rarity.from(new Sat(50 * COIN_VALUE - 1)).toString(),
      ).toStrictEqual("common");
      expect(
        Rarity.from(new Sat(50 * COIN_VALUE + 1)).toString(),
      ).toStrictEqual("common");

      expect(
        Rarity.from(
          new Sat(50 * COIN_VALUE * DIFFCHANGE_INTERVAL - 1),
        ).toString(),
      ).toStrictEqual("common");
      expect(
        Rarity.from(
          new Sat(50 * COIN_VALUE * DIFFCHANGE_INTERVAL + 1),
        ).toString(),
      ).toStrictEqual("common");

      expect(Rarity.from(new Sat(1)).toString()).toStrictEqual("common");
    });
  });
});
