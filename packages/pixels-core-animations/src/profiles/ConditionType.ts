import { enumValue } from "@systemic-games/pixels-core-utils";

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

/** The "enum" type for {@link ConditionTypeValues}. */
export type ConditionType =
  typeof ConditionTypeValues[keyof typeof ConditionTypeValues];
