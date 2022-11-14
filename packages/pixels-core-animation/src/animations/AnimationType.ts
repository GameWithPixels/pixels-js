import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * @category Animation
 * @enum
 */
export const AnimationTypeValues = {
  Unknown: enumValue(0),
  Simple: enumValue(),
  Rainbow: enumValue(),
  Keyframed: enumValue(),
  GradientPattern: enumValue(),
  Gradient: enumValue(),
  Noise: enumValue(),
  Cycle: enumValue(),
  Name: enumValue(),
} as const;

/**
 * The "enum" type for {@link AnimationTypeValues}.
 * @category Animation
 */
export type AnimationType =
  typeof AnimationTypeValues[keyof typeof AnimationTypeValues];
