export function unsigned32ToHex(pixelId: number): string {
  return (pixelId >>> 0).toString(16).padStart(8);
}
