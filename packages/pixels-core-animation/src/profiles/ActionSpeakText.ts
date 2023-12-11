import { serializable } from "@systemic-games/pixels-core-utils";

import Action from "./Action";
import { ActionTypeValues } from "./ActionType";

/**
 * Action to play a sound on the connected device.
 * @category Profile Action
 */
export default class ActionSpeakText implements Action {
  @serializable(1)
  type: number = ActionTypeValues.speakText;

  @serializable(2)
  actionId = 0;
}
