import { DIFFCHANGE_INTERVAL, SUBSIDY_HALVING_INTERVAL } from "../constants";
import { Degree } from "../Degree";
import { Sat } from "../Sat";

describe("Degree", () => {
  describe("constructor", () => {
    test("should return hour, minute, second and third correctly", () => {
      expect(new Degree(new Sat(0)).hour).toStrictEqual(0);
      expect(new Degree(new Sat(0)).minute).toStrictEqual(0);
      expect(new Degree(new Sat(0)).second).toStrictEqual(0);
      expect(new Degree(new Sat(0)).third).toStrictEqual(0);

      expect(new Degree(new Sat(1)).hour).toStrictEqual(0);
      expect(new Degree(new Sat(1)).minute).toStrictEqual(0);
      expect(new Degree(new Sat(1)).second).toStrictEqual(0);
      expect(new Degree(new Sat(1)).third).toStrictEqual(1);

      expect(
        new Degree(
          new Sat(
            5_000_000_000 * SUBSIDY_HALVING_INTERVAL +
              2_500_000_000 * SUBSIDY_HALVING_INTERVAL +
              1_250_000_000 * SUBSIDY_HALVING_INTERVAL +
              625_000_000 * SUBSIDY_HALVING_INTERVAL +
              312_500_000 * SUBSIDY_HALVING_INTERVAL +
              156_250_000 * SUBSIDY_HALVING_INTERVAL,
          ),
        ).hour,
      ).toStrictEqual(1);

      expect(
        new Degree(new Sat(5_000_000_000 * DIFFCHANGE_INTERVAL)).minute,
      ).toStrictEqual(DIFFCHANGE_INTERVAL);

      expect(
        new Degree(new Sat(5_000_000_000 * SUBSIDY_HALVING_INTERVAL)).second,
      ).toStrictEqual(336);
    });
  });

  describe("toString", () => {
    test("should return toString correctly", () => {
      expect(new Degree(new Sat(0)).toString()).toStrictEqual("0°0′0″0‴");

      expect(new Degree(new Sat(1)).toString()).toStrictEqual("0°0′0″1‴");

      expect(
        new Degree(
          new Sat(
            5_000_000_000 * SUBSIDY_HALVING_INTERVAL +
              2_500_000_000 * SUBSIDY_HALVING_INTERVAL +
              1_250_000_000 * SUBSIDY_HALVING_INTERVAL +
              625_000_000 * SUBSIDY_HALVING_INTERVAL +
              312_500_000 * SUBSIDY_HALVING_INTERVAL +
              156_250_000 * SUBSIDY_HALVING_INTERVAL,
          ),
        ).toString(),
      ).toStrictEqual("1°0′0″0‴");

      expect(
        new Degree(new Sat(5_000_000_000 * DIFFCHANGE_INTERVAL)).toString(),
      ).toStrictEqual("0°2016′0″0‴");

      expect(
        new Degree(
          new Sat(5_000_000_000 * SUBSIDY_HALVING_INTERVAL),
        ).toString(),
      ).toStrictEqual("0°0′336″0‴");
    });
  });
});
