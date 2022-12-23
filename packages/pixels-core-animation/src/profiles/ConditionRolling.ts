import { serializable } from "@systemic-games/pixels-core-utils";

import Condition from "./Condition";
import { ConditionType, ConditionTypeValues } from "./ConditionType";

/**
 * Condition that triggers when the Pixel is being rolled.
 * @category Profile Condition
 */
export default class ConditionRolling implements Condition {
  @serializable(1, { padding: 1 })
  type: ConditionType = ConditionTypeValues.rolling;

  @serializable(2)
  repeatPeriodMs = 0; // 0 means do NOT repeat
}
