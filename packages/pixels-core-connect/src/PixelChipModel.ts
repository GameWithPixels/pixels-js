import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * The possible chip models used for Pixels dice.
 * @enum
 * @category Message
 */
export const PixelChipModelValues = {
  unknown: enumValue(0),
  nRF52810: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link PixelChipModelValues}.
 * @category Message
 */
export type PixelChipModel = keyof typeof PixelChipModelValues;
