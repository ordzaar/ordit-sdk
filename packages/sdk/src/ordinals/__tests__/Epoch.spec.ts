import { SAT_SUPPLY, SUBSIDY_HALVING_INTERVAL } from "../constants";
import { Epoch } from "../Epoch";
import { Height } from "../Height";
import { Sat } from "../Sat";

describe("Epoch", () => {
  describe("from", () => {
    test("should return Epoch from sat", () => {
      expect(Epoch.from(new Sat(0))).toEqual(new Epoch(0));
      expect(Epoch.from(new Sat(1))).toEqual(new Epoch(0));
      expect(Epoch.from(new Epoch(2).startingSat)).toEqual(new Epoch(2));
      expect(Epoch.from(new Sat(new Epoch(2).startingSat.n + 1))).toEqual(
        new Epoch(2),
      );
      expect(Epoch.from(new Sat(2_067_187_500_000_000))).toEqual(new Epoch(6));
    });
  });

  describe("fromHeight", () => {
    test("should return Epoch from height", () => {
      expect(Epoch.fromHeight(new Height(0))).toEqual(new Epoch(0));
      expect(Epoch.fromHeight(new Height(1))).toEqual(new Epoch(0));
      expect(
        Epoch.fromHeight(new Height(SUBSIDY_HALVING_INTERVAL - 1)),
      ).toEqual(new Epoch(0));
      expect(Epoch.fromHeight(new Height(SUBSIDY_HALVING_INTERVAL))).toEqual(
        new Epoch(1),
      );
      expect(
        Epoch.fromHeight(new Height(SUBSIDY_HALVING_INTERVAL + 1)),
      ).toEqual(new Epoch(1));
    });
  });

  describe("subsidy", () => {
    test("should return subsidy", () => {
      expect(new Epoch(0).subsidy).toStrictEqual(5000000000);
      expect(new Epoch(1).subsidy).toStrictEqual(2500000000);
      expect(new Epoch(32).subsidy).toStrictEqual(1);
      expect(new Epoch(33).subsidy).toStrictEqual(0);
    });
  });

  describe("startingSat", () => {
    test("should return starting sat", () => {
      expect(new Epoch(0).startingSat).toEqual(new Sat(0));
      expect(new Epoch(1).startingSat).toEqual(new Sat(1050000000000000));
      expect(new Epoch(2).startingSat).toEqual(new Sat(1575000000000000));
      expect(new Epoch(32).startingSat).toEqual(new Sat(2099999997480000));
      expect(new Epoch(33).startingSat).toEqual(new Sat(SAT_SUPPLY));
    });
  });
});
