import { serializable } from "@systemic-games/pixels-core-utils";

import Condition from "./Condition";
import { ConditionType, ConditionTypeValues } from "./ConditionType";

/**
 * Condition that triggers when the Pixel is being handled.
 * @category Profile Condition
 */
export default class ConditionHandling implements Condition {
  @serializable(1, { padding: 3 })
  type: ConditionType = ConditionTypeValues.handling;
}
