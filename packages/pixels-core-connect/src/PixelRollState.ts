import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * Pixel roll states.
 * @enum
 * @category Message
 */
export const PixelRollStateValues = {
  /** The Pixel roll state could not be determined. */
  unknown: enumValue(0),

  /** The Pixel is resting in a position with a face up. */
  onFace: enumValue(),

  /** The Pixel is being handled. */
  handling: enumValue(),

  /** The Pixel is rolling. */
  rolling: enumValue(),

  /** The Pixel is resting in a crooked position. */
  crooked: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link PixelRollStateValues}.
 * @category Message
 */
export type PixelRollState = keyof typeof PixelRollStateValues;
