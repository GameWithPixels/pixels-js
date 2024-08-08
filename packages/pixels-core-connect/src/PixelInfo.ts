import {
  PixelColorway,
  PixelDieType,
} from "@systemic-games/pixels-core-animation";

import { PixelRollState } from "./PixelRollState";

/**
 * Common accessible values for all Pixel implementations.
 * @category Pixels
 */
export type PixelInfo = Readonly<{
  /** The unique id assigned by the system to the Pixel Bluetooth peripheral. */
  systemId: string;

  /** The unique Pixel id of the device. */
  pixelId: number;

  /** The Pixels die name. */
  name: string;

  /** The number of LEDs of the Pixel. */
  ledCount: number;

  /** The Pixel color. */
  colorway: PixelColorway;

  /** The Pixel die type. */
  dieType: PixelDieType;

  /** The Pixel firmware build date. */
  firmwareDate: Date;

  /** The last RSSI value measured by the Pixel. */
  rssi: number;

  /** The Pixel battery level (percentage). */
  batteryLevel: number; // Percentage

  /**
   * Whether the Pixel battery is charging or not.
   * Set to 'true' if fully charged but still on charger.
   */
  isCharging: boolean;

  /** The Pixel roll state. */
  rollState: PixelRollState;

  /**
   * The value of the die face that is currently facing up.
   * @remarks
   * - This value is always an integer number.
   * - D10 returns values ranging from 0 to 9 included.
   * - D00 returns 0, 10, 20, ..., 90.
   * - Fudge die returns +1, 0 and -1.
   **/
  currentFace: number;

  /**
   * The 0-based index of the die face that is currently facing up.
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
  currentFaceIndex: number;
}>;
