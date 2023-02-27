import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * Defines the supported types of actions.
 * @category Profile Action
 * @enum
 */
export const ActionTypeValues = {
  none: enumValue(0),
  playAnimation: enumValue(),
  runOnDevice: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link ActionTypeValues}.
 * @category Profile Action
 */
export type ActionTypeNames = keyof typeof ActionTypeValues;

/**
 * The "enum" type for {@link ActionTypeValues}.
 * @category Profile Action
 */
export type ActionType = typeof ActionTypeValues[ActionTypeNames];
