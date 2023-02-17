import {
    BatteryState,
    PixelBatteryStateValues,
} from "./Messages";

/**
 * Returns whether the passed in battery controller state means the pixel is currently charging
 * @param value The Pixel battery controller enum value.
 * @returns A boolean indicating whether the Pixel is charging.
 */
export default function(
    value: BatteryState | undefined)
    : boolean {
        switch (value) {
            case PixelBatteryStateValues.unknown: 
            case PixelBatteryStateValues.ok:
            case PixelBatteryStateValues.low:
            case PixelBatteryStateValues.badCharging:
            case PixelBatteryStateValues.error:
            case PixelBatteryStateValues.lowTemp:
            case PixelBatteryStateValues.highTemp:
            case PixelBatteryStateValues.transition:
            default:
                return false;

            case PixelBatteryStateValues.charging:
            case PixelBatteryStateValues.trickleCharge:
            case PixelBatteryStateValues.done:
                return true;
        }
  }
  