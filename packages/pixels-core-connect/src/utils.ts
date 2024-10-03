export function fromShortBluetoothId(shortId: number): string {
  return `0000${shortId.toString(16).padStart(4, "0")}-0000-1000-8000-00805f9b34fb`;
}
