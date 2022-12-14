import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * @category Profile Condition
 * @enum
 */
export const ConditionTypeValues = {
  unknown: enumValue(0),
  helloGoodbye: enumValue(),
  handling: enumValue(),
  rolling: enumValue(),
  faceCompare: enumValue(),
  crooked: enumValue(),
  connectionState: enumValue(),
  catteryState: enumValue(),
  idle: enumValue(),
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
