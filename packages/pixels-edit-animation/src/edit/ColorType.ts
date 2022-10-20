import { enumValue } from "@systemic-games/pixels-core-utils";

export const ColorTypeValues = {
  Rgb: enumValue(0),
  Face: enumValue(),
  Random: enumValue(),
} as const;

/** The "enum" type for {@link ColorTypeValues}. */
export type ColorType = typeof ColorTypeValues[keyof typeof ColorTypeValues];
