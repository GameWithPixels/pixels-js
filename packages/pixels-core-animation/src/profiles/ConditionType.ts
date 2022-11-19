import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * @category Profile Condition
 * @enum
 */
export const ConditionTypeValues = {
  Unknown: enumValue(0),
  HelloGoodbye: enumValue(),
  Handling: enumValue(),
  Rolling: enumValue(),
  FaceCompare: enumValue(),
  Crooked: enumValue(),
  ConnectionState: enumValue(),
  BatteryState: enumValue(),
  Idle: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link ConditionTypeValues}.
 * @category Profile Condition
 */
export type ConditionTypeNames = keyof typeof ConditionTypeValues;

/**
 * The "enum" type for {@link ConditionTypeValues}.
 * @category Profile Condition
 */
export type ConditionType = typeof ConditionTypeValues[ConditionTypeNames];
