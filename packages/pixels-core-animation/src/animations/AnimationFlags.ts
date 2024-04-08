import { enumFlag } from "@systemic-games/pixels-core-utils";

/**
 * Flags for the animations, they can be combined.
 * @category Animation
 * @enum
 */
export const AnimationFlagsValues = {
  /** Default behavior. */
  none: 0,
  /** Make the animation travel around the dice, only available for the Rainbow animation. */
  traveling: enumFlag(0),
  /** Play animation is using LED indices, not face indices. */
  useLedIndices: enumFlag(),
} as const;

/**
 * The names for the "enum" type {@link AnimationFlagsValues}.
 * @category Animation
 */
export type AnimationFlags = keyof typeof AnimationFlagsValues;
