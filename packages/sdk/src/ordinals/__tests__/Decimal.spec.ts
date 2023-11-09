import { LAST_SAT } from "../constants";
import { Decimal } from "../Decimal";
import { Height } from "../Height";
import { Sat } from "../Sat";

describe("Decimal", () => {
  describe("from", () => {
    test("should return height and offset correctly", () => {
      expect(Decimal.from(new Sat(0)).height).toEqual(new Height(0));
      expect(Decimal.from(new Sat(0)).offset).toStrictEqual(0);

      expect(Decimal.from(new Sat(1)).height).toEqual(new Height(0));
      expect(Decimal.from(new Sat(1)).offset).toStrictEqual(1);

      expect(Decimal.from(new Sat(LAST_SAT)).height).toEqual(
        new Height(6929999),
      );
      expect(Decimal.from(new Sat(LAST_SAT)).offset).toStrictEqual(0);
    });
  });

  describe("toString", () => {
    test("should return toString correctly", () => {
      expect(Decimal.from(new Sat(0)).toString()).toStrictEqual("0.0");

      expect(Decimal.from(new Sat(1)).toString()).toStrictEqual("0.1");

      expect(Decimal.from(new Sat(LAST_SAT)).toString()).toStrictEqual(
        "6929999.0",
      );
    });
  });
});
