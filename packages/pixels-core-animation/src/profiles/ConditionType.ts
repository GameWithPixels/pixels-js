import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * @category Profile Condition
 * @enum
 */
export const ConditionTypeValues = {
  none: enumValue(0),
  helloGoodbye: enumValue(),
  handling: enumValue(),
  rolling: enumValue(),
  faceCompare: enumValue(),
  crooked: enumValue(),
  connection: enumValue(),
  battery: enumValue(),
  idle: enumValue(),
  rolled: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link ConditionTypeValues}.
 * @category Profile Condition
 */
export type ConditionType = keyof typeof ConditionTypeValues;
