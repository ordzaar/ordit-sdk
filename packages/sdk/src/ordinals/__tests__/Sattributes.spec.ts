import { COIN_VALUE, SUBSIDY_HALVING_INTERVAL } from "../constants";
import { Sat } from "../Sat";
import { Sattribute, Sattributes } from "../Sattributes";

describe("Sattributes", () => {
  describe("from", () => {
    test("should return correct Sattributes", () => {
      expect(Sattributes.from(new Sat(0))).toEqual(
        new Sattributes([Sattribute.Mythic, Sattribute.Palindrome]),
      );
      expect(Sattributes.from(new Sat(2_067_187_500_000_000))).toEqual(
        new Sattributes([Sattribute.Legendary]),
      );
      expect(
        Sattributes.from(new Sat(50 * COIN_VALUE * SUBSIDY_HALVING_INTERVAL)),
      ).toEqual(new Sattributes([Sattribute.Epic]));
      expect(Sattributes.from(new Sat(1))).toEqual(
        new Sattributes([Sattribute.Common, Sattribute.Palindrome]),
      );
    });
  });

  describe("isPalindrome", () => {
    test("should return true for valid palindrome numbers", () => {
      expect(Sattributes.isPalindrome(1)).toStrictEqual(true);
      expect(Sattributes.isPalindrome(121)).toStrictEqual(true);
      expect(Sattributes.isPalindrome(1221)).toStrictEqual(true);
      expect(Sattributes.isPalindrome(947230616032749)).toStrictEqual(true);
      expect(Sattributes.isPalindrome(773028555820377)).toStrictEqual(true);
    });

    test("should return false for invalid palindrome numbers", () => {
      expect(Sattributes.isPalindrome(12)).toStrictEqual(false);
      expect(Sattributes.isPalindrome(1201)).toStrictEqual(false);
      expect(Sattributes.isPalindrome(1944583750000000)).toStrictEqual(false);
      expect(Sattributes.isPalindrome(1900558124999999)).toStrictEqual(false);
    });
  });
});
