import { serializable } from "@systemic-games/pixels-core-utils";

import Condition from "./Condition";
import { ConditionTypeValues } from "./ConditionType";

/**
 * Condition that triggers when the Pixel has landed by is crooked.
 * @category Profile Condition
 */
export default class ConditionCrooked implements Condition {
  @serializable(1, { padding: 3 })
  type: number = ConditionTypeValues.crooked;
}
