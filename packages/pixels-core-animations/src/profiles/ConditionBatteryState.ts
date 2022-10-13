import { enumFlag, serializable } from "@systemic-games/pixels-core-utils";
import Condition from "./Condition";
import { ConditionType, ConditionTypeValues } from "./ConditionType";

/// <summary>
/// Indicates which battery event the condition should trigger on
/// </summary>
export const BatteryStateFlagsValues = {
  Ok: enumFlag(0),
  Low: enumFlag(),
  Charging: enumFlag(),
  Done: enumFlag(),
} as const;

/** The "enum" type for {@link BatteryStateFlagsValues}. */
export type BatteryStateFlags =
  typeof BatteryStateFlagsValues[keyof typeof BatteryStateFlagsValues];

/// <summary>
/// Condition that triggers on battery state events
/// </summary>
export default class ConditionBatteryState implements Condition {
  @serializable(1)
  type: ConditionType = ConditionTypeValues.BatteryState;

  @serializable(1)
  flags: BatteryStateFlags = 0;

  @serializable(2)
  repeatPeriodMs = 0;
}
