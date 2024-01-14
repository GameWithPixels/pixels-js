import {
  DataSet,
  Action,
  ActionSpeakText,
  ActionTypeValues,
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

  @observable
  pitch: number;

  @observable
  rate: number;

  constructor(opt?: { text?: string; volume?: number }) {
    super();
    this.text = opt?.text ?? "";
    this.pitch = opt?.volume ?? 1;
    this.rate = opt?.volume ?? 1;
  }

  toAction(_editSet: EditDataSet, _set: DataSet, actionId: number): Action {
    return safeAssign(new ActionSpeakText(), {
      type: ActionTypeValues.playAudioClip,
      actionId,
    });
  }

  duplicate(): EditAction {
    return new EditActionSpeakText(this);
  }
}
