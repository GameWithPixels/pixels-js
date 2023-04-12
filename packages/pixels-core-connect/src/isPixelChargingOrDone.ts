import { PixelBatteryStateValues } from "./Messages";

/**
 * Returns whether the given battery controller state means that the pixel
 * is currently charging or is still on charger but done charging.
 * @param value The Pixel battery state.
 * @returns Whether the Pixel is charging.
 */
export function isPixelChargingOrDone(value: number | undefined): boolean {
  switch (value) {
    case PixelBatteryStateValues.charging:
    case PixelBatteryStateValues.trickleCharge:
    case PixelBatteryStateValues.done:
      return true;
    default:
      return false;
  }
}
