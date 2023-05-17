import { enumFlag, serializable } from "@systemic-games/pixels-core-utils";

import Condition from "./Condition";
import { ConditionTypeValues } from "./ConditionType";

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
  badCharging: enumFlag(),
  error: enumFlag(),
} as const;

/**
 * The names for the "enum" type {@link BatteryStateFlagsValues}.
 * @category Profile Condition
 */
export type BatteryStateFlags = keyof typeof BatteryStateFlagsValues;

/**
 * Condition that triggers on battery state events.
 * @category Profile Condition
 */
export default class ConditionBatteryState implements Condition {
  @serializable(1)
  type: number = ConditionTypeValues.batteryState;

  @serializable(1)
  flags: number = 0;

  @serializable(2)
  repeatPeriodMs = 0;
}
