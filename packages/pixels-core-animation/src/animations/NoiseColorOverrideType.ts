import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * @category Animation Runtime Color Override type
 * @enum
 */
export const NoiseColorOverrideTypeValues = {
  none: enumValue(0),
  randomFromGradient: enumValue(),
  faceToGradient: enumValue(),
  faceToRainbowWheel: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link NoiseColorOverrideTypeValues}.
 * @category Animation
 */
export type NoiseColorOverrideType = keyof typeof NoiseColorOverrideTypeValues;
