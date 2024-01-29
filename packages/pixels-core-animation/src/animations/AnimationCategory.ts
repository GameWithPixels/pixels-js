import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * @category Animation
 * @enum
 */
export const AnimationCategoryValues = {
  system: enumValue(0),
  uniform: enumValue(),
  colorful: enumValue(),
  flashy: enumValue(),
  animated: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link AnimationCategoryValues}.
 * @category Animation
 */
export type AnimationCategory = keyof typeof AnimationCategoryValues;
