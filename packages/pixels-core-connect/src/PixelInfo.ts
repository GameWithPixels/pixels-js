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

  /**
   * The value of the Pixel face that is currently facing up.
   * @remarks
   * - This value is always an integer number.
   * - D10 returns values ranging from 0 to 9 included.
   * - D00 returns 0, 10, 20, ..., 90.
   * - Fudge die returns +1, 0 and -1.
   **/
  readonly currentFace: number;

  /**
   * The 0-based index of the Pixel face that is currently facing up.
   * @remarks
   * Indices are continuous and follow the numerical order of the die faces values.
   *
   * @example
   * A D20 die will have face indices ranging from 0 to 19.
   * Index 0 corresponds to face 1 and index 19 to face 20.
   *
   * D10 and D00 share the same face indices but have different face values.
   * Index 0 corresponds to face 0 of both dice types.
   * Index 9 corresponds to face 9 for a D10 and to face 90 for a D00.
   *
   * The fudge die returns the following indices:
   * - O and 5 for the "+" face .
   * - 1 and 4 for the "-" face.
   * - 2 and 3 for the "blank" face.
   */
  readonly currentFaceIndex: number;
}
