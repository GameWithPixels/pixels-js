import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * @enum
 */
export const ColorTypeValues = {
  Rgb: enumValue(0),
  Face: enumValue(),
  Random: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link ColorTypeValues}.
 */
export type ColorTypeNames = keyof typeof ColorTypeValues;

/** The "enum" type for {@link ColorTypeValues}. */
export type ColorType = typeof ColorTypeValues[ColorTypeNames];
