import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * Pixels dice roll states.
 * @enum
 * @category Message
 */
export const PixelRollStateValues = {
  /** The die roll state could not be determined. */
  unknown: enumValue(0),

  /** The die finished rolling and is now on a face, and it looked like a proper roll. */
  rolled: enumValue(),

  /** The die is being handled. */
  handling: enumValue(),

  /** The die is rolling. */
  rolling: enumValue(),

  /** The die finished rolling but is not on a valid face. */
  crooked: enumValue(),

  /**
   * The die is not moving and, as far as we know, it has either
   * never moved or it didn't move enough to trigger a roll.
   */
  onFace: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link PixelRollStateValues}.
 * @category Message
 */
export type PixelRollState = keyof typeof PixelRollStateValues;
