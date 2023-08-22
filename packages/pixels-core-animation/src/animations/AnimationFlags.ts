import { enumFlag } from "@systemic-games/pixels-core-utils";

/**
 * @category Animation
 * @enum
 */
export const AnimationFlagsValues = {
  none: enumFlag(0),
  traveling: enumFlag(),
  useLedIndices: enumFlag(),
} as const;

/**
 * The names for the "enum" type {@link AnimationFlagsValues}.
 * @category Animation
 */
export type AnimationFlags = keyof typeof AnimationFlagsValues;
