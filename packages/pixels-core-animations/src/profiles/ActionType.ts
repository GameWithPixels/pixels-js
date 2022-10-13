import { enumValue } from "@systemic-games/pixels-core-utils";

/// <summary>
/// Defines the supported types of actions.
/// </summary>
export const ActionTypeValues = {
  Unknown: enumValue(0),
  PlayAnimation: enumValue(),
  PlayAudioClip: enumValue(),
} as const;

/** The "enum" type for {@link ActionTypeValues}. */
export type ActionType = typeof ActionTypeValues[keyof typeof ActionTypeValues];
