import { DIFFCHANGE_INTERVAL } from "./constants";
// eslint-disable-next-line import/no-cycle
import { Epoch } from "./Epoch";
// eslint-disable-next-line import/no-cycle
import { Sat } from "./Sat";

export class Height {
  #startingSat?: Sat;

  #periodOffset?: number;

  constructor(readonly n: number) {}

  get startingSat(): Sat {
    if (this.#startingSat === undefined) {
      const epoch = Epoch.fromHeight(this);
      const { startingSat } = epoch;
      const { startingHeight } = epoch;
      this.#startingSat = new Sat(
        startingSat.n + (this.n - startingHeight.n) * epoch.subsidy
      );
    }
    return this.#startingSat;
  }

  get periodOffset(): number {
    if (this.#periodOffset === undefined) {
      this.#periodOffset = Math.floor(this.n % DIFFCHANGE_INTERVAL);
    }
    return this.#periodOffset;
  }

  add(n: number): Height {
    return new Height(this.n + n);
  }

  sub(n: number): Height {
    return new Height(this.n - n);
  }

  eq(n: number): boolean {
    return this.n === n;
  }
}
