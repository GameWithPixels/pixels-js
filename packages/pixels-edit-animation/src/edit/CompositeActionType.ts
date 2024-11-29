import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * Defines the supported types of actions for a composite profile.
 * @enum
 */
export const CompositeActionTypeValues = {
  none: enumValue(0),
  playMcpAnimation: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link CompositeActionTypeValues}.
 */
export type CompositeActionType = keyof typeof CompositeActionTypeValues;
