import { DIFFCHANGE_INTERVAL, SUBSIDY_HALVING_INTERVAL } from "../constants";
import { Height } from "../Height";
import { Sat, STARTING_SATS } from "../Sat";

describe("Height", () => {
  describe("startingSat", () => {
    test("should return startingSat", () => {
      expect(new Height(0).startingSat).toEqual(new Sat(0));
      expect(new Height(1).startingSat).toEqual(new Sat(5000000000));
      expect(new Height(SUBSIDY_HALVING_INTERVAL).startingSat).toEqual(
        STARTING_SATS[1],
      );
    });
  });

  describe("periodOffset", () => {
    test("should return periodOffset", () => {
      expect(new Height(0).periodOffset).toStrictEqual(0);
      expect(new Height(1).periodOffset).toStrictEqual(1);
      expect(new Height(DIFFCHANGE_INTERVAL - 1).periodOffset).toStrictEqual(
        2015,
      );
      expect(new Height(DIFFCHANGE_INTERVAL).periodOffset).toStrictEqual(0);
      expect(new Height(DIFFCHANGE_INTERVAL + 1).periodOffset).toStrictEqual(1);
    });
  });

  describe("add", () => {
    test("should add n to the height", () => {
      expect(new Height(0).add(1)).toEqual(new Height(1));
      expect(new Height(1).add(100)).toEqual(new Height(101));
    });
  });

  describe("sub", () => {
    test("should subtract n to the height", () => {
      expect(new Height(1).sub(1)).toEqual(new Height(0));
      expect(new Height(101).sub(100)).toEqual(new Height(1));
    });
  });

  describe("eq", () => {
    test("should return true if n is equal to height", () => {
      expect(new Height(1).eq(1)).toStrictEqual(true);
      expect(new Height(101).eq(101)).toStrictEqual(true);
    });
    test("should return false if n is not equal to height", () => {
      expect(new Height(1).eq(2)).toStrictEqual(false);
      expect(new Height(101).eq(2)).toStrictEqual(false);
    });
  });
});
