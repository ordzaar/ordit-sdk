export function fromXOnlyToFullPubkey(xOnly: string): string {
  const xOnlyBuffer = Buffer.from(xOnly, "hex");
  // if xOnly is 33 bytes, it's already a full pubkey
  if (xOnlyBuffer.length === 33) {
    return xOnly;
  }
  // source: https://medium.com/blockstream/reducing-bitcoin-transaction-sizes-with-x-only-pubkeys-f86476af05d7
  return `02${xOnly}`; // prepend y-coord/tie-breaker to x-only
}
