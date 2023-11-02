import { Sat } from "./Sat";

export class Rarity {
  // every other sats
  static readonly Common = "common";
  // The first sat of a every new block (~ 10 mins)
  static readonly Uncommon = "uncommon";
  // The first sat after difficulty adjustment block, every 2016 blocks (~ 2 weeks)
  static readonly Rare = "rare";
  // The first sat of a halving epoch block, every 210_000 blocks (~4 years)
  static readonly Epic = "epic";
  // the first sat after every 6 halving (~ 24 years)
  static readonly Legendary = "legendary";
  // the first sat ever mined
  static readonly Mythic = "mythic";

  constructor(readonly name: string) {}

  static from(sat: Sat): Rarity {
    const { hour, minute, second, third } = sat.degree;
    if (hour === 0 && minute === 0 && second === 0 && third === 0) {
      return new Rarity(Rarity.Mythic);
    }
    if (minute === 0 && second === 0 && third === 0) {
      return new Rarity(Rarity.Legendary);
    }
    if (minute === 0 && third === 0) {
      return new Rarity(Rarity.Epic);
    }
    if (second === 0 && third === 0) {
      return new Rarity(Rarity.Rare);
    }
    if (third === 0) {
      return new Rarity(Rarity.Uncommon);
    }
    return new Rarity(Rarity.Common);
  }

  toString() {
    return this.name;
  }
}
