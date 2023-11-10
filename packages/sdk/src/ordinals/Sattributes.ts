import type { Sat } from "./Sat";

export enum Sattribute {
  // every other sats
  Common = "common",
  // The first sat of every new block (~ 10 mins)
  Uncommon = "uncommon",
  // The first sat after each difficulty adjustment block, every 2016 blocks (~ 2 weeks)
  Rare = "rare",
  // The first sat after each halving epoch block, every 210_000 blocks (~4 years)
  Epic = "epic",
  // The first sat after every 6 halving (~ 24 years)
  Legendary = "legendary",
  // The first sat of the genesis block
  Mythic = "mythic",
  // The sat that reads the same forward and backward
  Palindrome = "palindrome",
}
export class Sattributes {
  constructor(readonly sattributes: Sattribute[]) {}

  static from(sat: Sat): Sattributes {
    const sattributesList = [];

    if (Sattributes.isPalindrome(sat.n)) {
      sattributesList.push(Sattribute.Palindrome);
    }

    return new Sattributes([sat.rarity.name, ...sattributesList]);
  }

  static isPalindrome(n: number): boolean {
    const numberString = n.toString();
    const numberStringReversed = numberString.split("").reverse().join("");
    return numberString === numberStringReversed;
  }

  toString() {
    return this.sattributes.toString();
  }

  toList() {
    return this.sattributes;
  }
}
