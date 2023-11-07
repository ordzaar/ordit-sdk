/**
 * 1 btc = 100_000_000 satoshis
 */
export const COIN_VALUE = 100_000_000;

/**
 * bitcoin halving happens after every 210_000 blocks
 */
export const SUBSIDY_HALVING_INTERVAL = 210_000;

/**
 * bitcoin mining difficulty changes every 2016 blocks (~2 weeks)
 */
export const DIFFCHANGE_INTERVAL = 2016;

/**
 * every 6 halving, it will coincide with difficulty adjustment.
 */
export const CYCLE_EPOCHS = 6;

/**
 * max satoshi supply
 */
export const SAT_SUPPLY = 2_099_999_997_690_000;

/**
 * the last satoshi number that will ever be mined
 */
export const LAST_SAT = SAT_SUPPLY - 1;
