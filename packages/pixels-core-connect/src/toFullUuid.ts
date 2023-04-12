/**
 * Converts a 16 bits Bluetooth LE UUID to a full 128 bit UUID.
 * @param shortUuid A short BLE UUID (16 bits).
 * @returns A 128 bits UUID as a string.
 */
export function toFullUuid(shortUuid: number): string {
  return (
    (shortUuid & 0xffffffff).toString(16).padStart(8, "0") +
    "-0000-1000-8000-00805f9b34fb"
  );
}
