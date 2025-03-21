import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * Defines the supported types of actions for a profile.
 * @category Profile Action
 * @enum
 */
export const ActionTypeValues = {
  none: enumValue(0),
  playAnimation: enumValue(),
  playAudioClip: enumValue(),
  makeWebRequest: enumValue(),
  speakText: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link ActionTypeValues}.
 * @category Profile Action
 */
export type ActionType = keyof typeof ActionTypeValues;
