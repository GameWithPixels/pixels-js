import { serializable } from "@systemic-games/pixels-core-utils";
import Condition from "./Condition";
import { ConditionType, ConditionTypeValues } from "./ConditionType";

/// <summary>
/// Condition that triggers when the Pixel is being rolled
/// </summary>
export default class ConditionRolling implements Condition {
  @serializable(1, { padding: 1 })
  type: ConditionType = ConditionTypeValues.Rolling;

  @serializable(2)
  repeatPeriodMs = 0; // 0 means do NOT repeat
}
