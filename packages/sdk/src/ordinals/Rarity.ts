import type { Sat } from "./Sat";
import { Sattribute } from "./Sattributes";

export type RarityAttribute =
  | Sattribute.Common
  | Sattribute.Uncommon
  | Sattribute.Rare
  | Sattribute.Epic
  | Sattribute.Legendary
  | Sattribute.Mythic;

export class Rarity {
  constructor(readonly name: RarityAttribute) {}

  static from(sat: Sat): Rarity {
    const { hour, minute, second, third } = sat.degree;
    if (hour === 0 && minute === 0 && second === 0 && third === 0) {
      return new Rarity(Sattribute.Mythic);
    }
    if (minute === 0 && second === 0 && third === 0) {
      return new Rarity(Sattribute.Legendary);
    }
    if (minute === 0 && third === 0) {
      return new Rarity(Sattribute.Epic);
    }
    if (second === 0 && third === 0) {
      return new Rarity(Sattribute.Rare);
    }
    if (third === 0) {
      return new Rarity(Sattribute.Uncommon);
    }
    return new Rarity(Sattribute.Common);
  }

  toString() {
    return this.name;
  }
}
