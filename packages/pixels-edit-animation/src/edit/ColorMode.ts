import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * The different color modes supported by the animation system.
 * @enum
 */
export const ColorModeValues = {
  /** The color is a given RGB value. */
  rgb: enumValue(0),
  /** The color is determined based on the die current face up. */
  face: enumValue(),
  /** The colors is randomly chosen. */
  random: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link ColorModeValues}.
 */
export type ColorMode = keyof typeof ColorModeValues;
