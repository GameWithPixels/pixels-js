import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * Defines the supported types of conditions for a composite profile.
 * @enum
 */
export const CompositeConditionTypeValues = {
  none: enumValue(0),
  result: enumValue(),
  rollTag: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link CompositeConditionTypeValues}.
 */
export type CompositeConditionType = keyof typeof CompositeConditionTypeValues;
