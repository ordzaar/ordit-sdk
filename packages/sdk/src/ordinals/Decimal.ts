import type { Height } from "./Height";
import type { Sat } from "./Sat";

/**
 * convert sat into decimal format. A.B
 */
export class Decimal {
  constructor(
    readonly height: Height, // A is the block height
    readonly offset: number, // B is the cycle number
  ) {}

  static from(sat: Sat): Decimal {
    return new Decimal(sat.height, sat.third);
  }

  toString(): string {
    return `${this.height.n}.${this.offset}`;
  }
}
