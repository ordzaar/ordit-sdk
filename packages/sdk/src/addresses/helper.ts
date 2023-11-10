/**
 * Inverts an object from `key: value` to `value: key`.
 *
 * @param data The object in `key: value` format. It cannot be an array.
 * @returns The object in `value: key` format.
 */
export function invert(data: Record<string, unknown> & { length?: never }) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [value, key]),
  );
}
