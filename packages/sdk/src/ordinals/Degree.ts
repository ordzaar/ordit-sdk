import {
  CYCLE_EPOCHS,
  DIFFCHANGE_INTERVAL,
  SUBSIDY_HALVING_INTERVAL,
} from "./constants";
import { Sat } from "./Sat";

/**
 * convert sat into degree format. A°B’C’’D’’’
 */
export class Degree {
  readonly hour: number; // A° - Index of Sat in the Block
  readonly minute: number; // B’ - Index of the Block in the Difficulty Adjustment Period (every 2016 blocks)
  readonly second: number; // C’’ - Index of Block in Halving Epoch (every 210_000 blocks)
  readonly third: number; // D’’’ - Cycle Number

  constructor(sat: Sat) {
    const height = sat.height.n;
    this.hour = Math.floor(height / (CYCLE_EPOCHS * SUBSIDY_HALVING_INTERVAL));
    this.minute = Math.floor(height % SUBSIDY_HALVING_INTERVAL);
    this.second = Math.floor(height % DIFFCHANGE_INTERVAL);
    this.third = sat.third;
  }

  toString(): string {
    return `${this.hour}°${this.minute}′${this.second}″${this.third}‴`;
  }
}
