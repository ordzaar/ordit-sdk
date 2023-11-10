export function fromXOnlyToFullPubkey(xOnly: string): string {
  return `02${xOnly}`; // prepend y-coord/tie-breaker to x-only
}
