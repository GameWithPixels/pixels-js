import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * Available Pixels dice colorways.
 * @enum
 * @category Message
 */
export const PixelColorwayValues = {
  unknown: enumValue(0),
  onyxBlack: enumValue(),
  hematiteGrey: enumValue(),
  midnightGalaxy: enumValue(),
  auroraSky: enumValue(),
  clear: enumValue(),
  custom: 0xff,
} as const;

/**
 * The names for the "enum" type {@link PixelColorwayValues}.
 * @category Message
 */
export type PixelColorway = keyof typeof PixelColorwayValues;
