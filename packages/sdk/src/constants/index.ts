/**
 * Amount lower than this is considered as dust value
 * and majority of the miners don't pick txs w/ the following output value or lower
 */
export const MINIMUM_AMOUNT_IN_SATS = 600;

/**
 * Fee calculated by the fee estimator cannot be greater than 0.05 BTC in any case
 */
export const MAXIMUM_FEE = 5000000;

/**
 * Maximum number of bytes pushable to the witness stack
 */
export const MAXIMUM_SCRIPT_ELEMENT_SIZE = 520;
