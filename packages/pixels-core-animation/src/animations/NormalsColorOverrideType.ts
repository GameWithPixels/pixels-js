import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * @category Animation Runtime Color Override type
 * @enum
 */
export const NormalsColorOverrideTypeValues = {
  none: enumValue(0),
  faceToGradient: enumValue(),
  faceToRainbowWheel: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link NormalsColorOverrideTypeValues}.
 * @category Animation
 */
export type NormalsColorOverrideType =
  keyof typeof NormalsColorOverrideTypeValues;
