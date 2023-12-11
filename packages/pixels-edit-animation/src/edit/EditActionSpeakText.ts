import {
  DataSet,
  Action,
  ActionSpeakText,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditAction from "./EditAction";
import EditActionRunOnDevice from "./EditActionRunOnDevice";
import EditDataSet from "./EditDataSet";
import { name, observable, widget } from "./decorators";

export default class EditActionSpeakText extends EditActionRunOnDevice {
  readonly type = "speakText";

  @widget("userText")
  @name("Text")
  @observable
  text: string;

  constructor(opt?: { text?: string }) {
    super();
    this.text = opt?.text ?? "";
  }

  toAction(_editSet: EditDataSet, _set: DataSet, actionId: number): Action {
    return safeAssign(new ActionSpeakText(), {
      actionId,
    });
  }

  duplicate(): EditAction {
    return new EditActionSpeakText(this);
  }
}
