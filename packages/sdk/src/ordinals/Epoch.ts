import { COIN_VALUE, SUBSIDY_HALVING_INTERVAL } from "./constants";
// eslint-disable-next-line import/no-cycle
import { Height } from "./Height";
import type { Sat } from "./Sat";
// eslint-disable-next-line import/no-cycle
import { STARTING_SATS } from "./Sat";

export class Epoch {
  /**
   * First epoch where no new bitcoin will be mined
   */
  static readonly FIRST_POST_SUBSIDY = new Epoch(33);

  #subsidy?: number;

  #startingSat?: Sat;

  #startingHeight?: Height;

  constructor(readonly n: number) {}

  static from(sat: Sat): Epoch {
    let i = 1;
    while (i <= 33) {
      if (sat.n < STARTING_SATS[i].n) {
        return new Epoch(i - 1);
      }
      i += 1;
    }
    return new Epoch(33);
  }

  static fromHeight(height: Height): Epoch {
    return new Epoch(Math.floor(height.n / SUBSIDY_HALVING_INTERVAL));
  }

  /**
   * subsidy refers to how much satoshis will be created/mined per block
   */
  get subsidy(): number {
    if (this.#subsidy === undefined) {
      if (this.n < Epoch.FIRST_POST_SUBSIDY.n) {
        this.#subsidy = Math.floor((50 * COIN_VALUE) / 2 ** this.n);
      } else {
        this.#subsidy = 0;
      }
    }
    return this.#subsidy;
  }

  get startingSat(): Sat {
    if (this.#startingSat === undefined) {
      this.#startingSat =
        STARTING_SATS[this.n] || STARTING_SATS[STARTING_SATS.length - 1];
    }
    return this.#startingSat;
  }

  get startingHeight(): Height {
    if (this.#startingHeight === undefined) {
      this.#startingHeight = new Height(this.n * SUBSIDY_HALVING_INTERVAL);
    }
    return this.#startingHeight;
  }
}
