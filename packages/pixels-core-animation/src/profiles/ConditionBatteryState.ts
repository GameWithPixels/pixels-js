import { enumFlag, serializable } from "@systemic-games/pixels-core-utils";

import Condition from "./Condition";
import { ConditionType, ConditionTypeValues } from "./ConditionType";

/**
 * Indicates which battery event the condition should trigger on.
 * @category Profile Condition
 * @enum
 */
export const BatteryStateFlagsValues = {
  Ok: enumFlag(0),
  Low: enumFlag(),
  Charging: enumFlag(),
  Done: enumFlag(),
} as const;

/**
 * The "enum" type for {@link BatteryStateFlagsValues}.
 * @category Profile Condition
 */
export type BatteryStateFlags =
  typeof BatteryStateFlagsValues[keyof typeof BatteryStateFlagsValues];

/**
 * Condition that triggers on battery state events.
 * @category Profile Condition
 */
export default class ConditionBatteryState implements Condition {
  @serializable(1)
  type: ConditionType = ConditionTypeValues.BatteryState;

  @serializable(1)
  flags: BatteryStateFlags = 0;

  @serializable(2)
  repeatPeriodMs = 0;
}
