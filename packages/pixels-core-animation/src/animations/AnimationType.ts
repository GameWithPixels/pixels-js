import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * @category Animation
 * @enum
 */
export const AnimationTypeValues = {
  none: enumValue(0),
  simple: enumValue(),
  rainbow: enumValue(),
  keyframed: enumValue(),
  gradientPattern: enumValue(),
  gradient: enumValue(),
  noise: enumValue(),
  cycle: enumValue(),
  name: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link AnimationTypeValues}.
 * @category Animation
 */
export type AnimationType = keyof typeof AnimationTypeValues;
