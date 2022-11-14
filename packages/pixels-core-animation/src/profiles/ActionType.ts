import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * Defines the supported types of actions.
 * @category Profile Action
 * @enum
 */
export const ActionTypeValues = {
  Unknown: enumValue(0),
  PlayAnimation: enumValue(),
  PlayAudioClip: enumValue(),
} as const;

/**
 * The "enum" type for {@link ActionTypeValues}.
 * @category Profile Action
 */
export type ActionType = typeof ActionTypeValues[keyof typeof ActionTypeValues];
