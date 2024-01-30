import { serializable } from "@systemic-games/pixels-core-utils";

import Condition from "./Condition";
import { ConditionTypeValues } from "./ConditionType";

/**
 * Condition that triggers when the Pixel has landed on a face.
 * @category Profile Condition
 */
export default class ConditionRolled implements Condition {
  @serializable(1, { padding: 3 })
  type: number = ConditionTypeValues.rolled;

  @serializable(4)
  faceMask = 0;
}
