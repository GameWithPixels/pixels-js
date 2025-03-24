import {
  DataSet,
  Action,
  ActionMakeWebRequest,
  ActionTypeValues,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditAction from "./EditAction";
import EditActionRunOnDevice from "./EditActionRunOnDevice";
import EditDataSet from "./EditDataSet";
import { WebRequestFormat } from "./WebRequestFormat";
import { name, observable, widget } from "./decorators";

export default class EditActionMakeWebRequest extends EditActionRunOnDevice {
  readonly type = "makeWebRequest";

  @widget("userText")
  @name("URL")
  @observable
  url: string;

  @widget("userText")
  @name("Value")
  @observable
  value: string;

  @name("Format")
  @observable
  format: WebRequestFormat;

  constructor(opt?: {
    url?: string;
    value?: string;
    format: WebRequestFormat;
  }) {
    super();
    this.url = opt?.url ?? "";
    this.value = opt?.value ?? "";
    this.format = opt?.format ?? "parameters";
  }

  toAction(_editSet: EditDataSet, _set: DataSet, actionId: number): Action {
    return safeAssign(new ActionMakeWebRequest(), {
      type: ActionTypeValues.playAudioClip, // TODO fix for FW compatibility
      actionId,
    });
  }

  duplicate(): EditAction {
    return new EditActionMakeWebRequest(this);
  }
}
