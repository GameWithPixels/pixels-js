import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * The different color modes supported by the animation system.
 * @enum
 */
export const ColorModeValues = {
  rgb: enumValue(0), // The color is a given RGB value.
  face: enumValue(), // The color is determined based on the die current face up.
  random: enumValue(), // The colors is randomly chosen.
} as const;

/**
 * The names for the "enum" type {@link ColorModeValues}.
 */
export type ColorMode = keyof typeof ColorModeValues;
