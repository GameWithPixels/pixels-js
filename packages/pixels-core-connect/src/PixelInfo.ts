import { PixelDieType } from "@systemic-games/pixels-core-animation";

import { PixelColorway, PixelRollState } from "./Messages";

/**
 * Common accessible values for all Pixel implementations.
 * @category Pixels
 */
export interface PixelInfo {
  /** The unique id assigned by the system to the Pixel Bluetooth peripheral. */
  readonly systemId: string;

  /** The unique Pixel id of the device. */
  readonly pixelId: number;

  /** The Pixel name. */
  readonly name: string;

  /** The number of LEDs of the Pixel. */
  readonly ledCount: number;

  /** The die color. */
  readonly colorway: PixelColorway;

  /** The type of die. */
  readonly dieType: PixelDieType;

  /** The firmware build date of the Pixel. */
  readonly firmwareDate: Date;

  /** The last RSSI value measured by the Pixel. */
  readonly rssi: number;

  /** The Pixel battery level (percentage). */
  readonly batteryLevel: number; // Percentage

  /**
   * Whether the Pixel battery is charging or not.
   * Set to 'true' if fully charged but still on charger.
   */
  readonly isCharging: boolean;

  /** The Pixel roll state. */
  readonly rollState: PixelRollState;

  /** The Pixel face value that is currently facing up. */
  readonly currentFace: number; // Face value (not index)
}
