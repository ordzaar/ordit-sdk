import {
  CYCLE_EPOCHS,
  DIFFCHANGE_INTERVAL,
  SUBSIDY_HALVING_INTERVAL,
} from "./constants";
import type { Sat } from "./Sat";

/**
 * Degree converts Sat into format `A°B′C″D‴`
 */
export class Degree {
  /**
   * A° - Index of Sat in the Block
   */
  readonly hour: number;

  /**
   * B′ - Index of the Block in the Difficulty Adjustment Period (every 2016 blocks)
   */
  readonly minute: number;

  /**
   * C″ - Index of Block in Halving Epoch (every 210_000 blocks)
   */
  readonly second: number;

  /**
   * D‴ - Cycle Number
   */
  readonly third: number;

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
