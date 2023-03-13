import {
  DataSet,
  ActionType,
  ActionTypeValues,
  Action,
  ActionMakeWebRequest,
  RemoteActionType,
  RemoteActionTypeValues,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditAction from "./EditAction";
import EditActionRunOnDevice from "./EditActionRunOnDevice";
import EditDataSet from "./EditDataSet";
import { name, observable, widget } from "./decorators";

export default class EditActionMakeWebRequest extends EditActionRunOnDevice {
  @widget("userText")
  @name("URL")
  @observable
  url: string;

  @widget("userText")
  @name("Value")
  @observable
  value: string;

  constructor(opt?: { url?: string; value?: string }) {
    super();
    this.url = opt?.url ?? "";
    this.value = opt?.value ?? "";
  }

  get type(): ActionType {
    return ActionTypeValues.runOnDevice;
  }

  get remoteType(): RemoteActionType {
    return RemoteActionTypeValues.makeWebRequest;
  }

  toAction(_editSet: EditDataSet, _set: DataSet, actionId: number): Action {
    return safeAssign(new ActionMakeWebRequest(), {
      actionId,
    });
  }

  duplicate(): EditAction {
    return new EditActionMakeWebRequest(this);
  }
}
