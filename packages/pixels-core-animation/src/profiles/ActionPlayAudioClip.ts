import { serializable } from "@systemic-games/pixels-core-utils";

import Action from "./Action";
import { ActionType, ActionTypeValues } from "./ActionType";

/**
 * Action to play a sound!
 * @category Profile Action
 */
export default class ActionPlayAudioClip implements Action {
  @serializable(1, { padding: 1 })
  type: ActionType = ActionTypeValues.playAudioClip;

  @serializable(2)
  clipId = 0;
}
