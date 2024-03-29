import { serializable } from "@systemic-games/pixels-core-utils";

import Condition from "./Condition";
import { ConditionTypeValues } from "./ConditionType";

/**
 * Condition that triggers when the Pixel is being handled.
 * @category Profile Condition
 */
export default class ConditionIdle implements Condition {
  @serializable(1, { padding: 1 })
  type: number = ConditionTypeValues.idle;

  @serializable(2)
  repeatPeriodMs = 0;
}
