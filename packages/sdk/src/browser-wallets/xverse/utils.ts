export function fromXOnlyToFullPubkey(xOnly: string): string {
  return `03${xOnly}`; // prepend y-coord/tie-breaker to x-only
}
