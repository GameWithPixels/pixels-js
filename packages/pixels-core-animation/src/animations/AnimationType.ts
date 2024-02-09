import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * @category Animation
 * @enum
 */
export const AnimationTypeValues = {
  none: enumValue(0), // 0
  simple: enumValue(), // 1
  rainbow: enumValue(), // 2
  keyframed: enumValue(), // 3
  gradientPattern: enumValue(), // 4
  gradient: enumValue(), // 5
  noise: enumValue(), // 6
  cycle: enumValue(), // 7
  name: enumValue(), // 8
  normals: enumValue(), // 9
  sequence: enumValue(), // 10
} as const;

/**
 * The names for the "enum" type {@link AnimationTypeValues}.
 * @category Animation
 */
export type AnimationType = keyof typeof AnimationTypeValues;
