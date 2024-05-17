import { unsigned32ToHex } from "@systemic-games/pixels-core-utils";

/**
 * Converts a 16 bits Bluetooth LE UUID to a full 128 bit UUID.
 * @param shortUuid A short BLE UUID (16 bits).
 * @returns A 128 bits UUID as a string.
 */
export function toFullUuid(shortUuid: number): string {
  return unsigned32ToHex(shortUuid) + "-0000-1000-8000-00805f9b34fb";
}
