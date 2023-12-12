import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * The different types of dice.
 * @enum
 * @category Message
 */
export const PixelDieTypeValues = {
  unknown: enumValue(0),
  d4: enumValue(),
  d6: enumValue(),
  d8: enumValue(),
  d10: enumValue(),
  d00: enumValue(),
  d12: enumValue(),
  d20: enumValue(),
  d6pipped: enumValue(),
  d6fudge: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link PixelDieTypeValues}.
 * @category Message
 */
export type PixelDieType = keyof typeof PixelDieTypeValues;
