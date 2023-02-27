import { serializable } from "@systemic-games/pixels-core-utils";

import Action from "./Action";
import { ActionType, ActionTypeValues } from "./ActionType";
import { RemoteActionType, RemoteActionTypeValues } from "./RemoteActionType";

/**
 * Action to play a sound on the connected device.
 * @category Profile Action
 */
export default class ActionMakeWebRequest implements Action {
  @serializable(1)
  type: ActionType = ActionTypeValues.runOnDevice;

  @serializable(1)
  remoteType: RemoteActionType = RemoteActionTypeValues.makeWebRequest;

  @serializable(2)
  actionId = 0;
}
