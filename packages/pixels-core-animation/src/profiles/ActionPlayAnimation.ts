import { serializable } from "@systemic-games/pixels-core-utils";

import Action from "./Action";
import { ActionType, ActionTypeValues } from "./ActionType";

/**
 * Action to play an animation.
 * @category Profile Action
 */
export default class ActionPlayAnimation implements Action {
  @serializable(1)
  type: ActionType = ActionTypeValues.PlayAnimation;

  @serializable(1)
  animIndex = 0;

  @serializable(1)
  faceIndex = 0;

  @serializable(1)
  loopCount = 0;
}
