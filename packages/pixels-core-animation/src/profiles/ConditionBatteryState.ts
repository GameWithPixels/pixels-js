import { enumFlag, serializable } from "@systemic-games/pixels-core-utils";

import Condition from "./Condition";
import { ConditionType, ConditionTypeValues } from "./ConditionType";

/**
 * Indicates which battery event the condition should trigger on.
 * @category Profile Condition
 * @enum
 */
export const BatteryStateFlagsValues = {
  ok: enumFlag(0),
  low: enumFlag(),
  charging: enumFlag(),
  done: enumFlag(),
  transition: enumFlag(),
  badCharging: enumFlag(),
  error: enumFlag(),
  trickleCharge: enumFlag(),
  lowTemp: enumFlag(),
  highTemp: enumFlag(),
} as const;

/**
 * The names for the "enum" type {@link BatteryStateFlagsValues}.
 * @category Profile Condition
 */
export type BatteryStateFlagsNames = keyof typeof BatteryStateFlagsValues;

/**
 * The "enum" type for {@link BatteryStateFlagsValues}.
 * @category Profile Condition
 */
export type BatteryStateFlags =
  (typeof BatteryStateFlagsValues)[BatteryStateFlagsNames];

/**
 * Condition that triggers on battery state events.
 * @category Profile Condition
 */
export default class ConditionBatteryState implements Condition {
  @serializable(1)
  type: ConditionType = ConditionTypeValues.batteryState;

  @serializable(1)
  flags: BatteryStateFlags = 0;

  @serializable(2)
  repeatPeriodMs = 0;
}
