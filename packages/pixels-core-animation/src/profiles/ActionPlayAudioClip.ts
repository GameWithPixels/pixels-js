import { serializable } from "@systemic-games/pixels-core-utils";

import Action from "./Action";
import { ActionTypeValues } from "./ActionType";
import { RemoteActionTypeValues } from "./RemoteActionType";

/**
 * Action to play a sound on the connected device.
 * @category Profile Action
 */
export default class ActionPlayAudioClip implements Action {
  @serializable(1)
  type: number = ActionTypeValues.runOnDevice;

  @serializable(1)
  remoteType: number = RemoteActionTypeValues.playAudioClip;

  @serializable(2)
  actionId = 0;
}
