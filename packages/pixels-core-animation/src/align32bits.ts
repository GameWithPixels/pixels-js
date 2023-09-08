export function align32bits(size: number): number {
  const extra = size % 4;
  return size + (extra ? 4 - extra : 0);
}
