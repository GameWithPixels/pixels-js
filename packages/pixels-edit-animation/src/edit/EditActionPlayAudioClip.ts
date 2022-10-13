import {
  DataSet,
  ActionType,
  ActionTypeValues,
  Action,
  ActionPlayAudioClip,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";
import EditAction from "./EditAction";
import EditAudioClip from "./EditAudioClip";
import EditDataSet from "./EditDataSet";
import { name } from "./decorators";

export default class EditActionPlayAudioClip extends EditAction {
  @name("Audio Clip")
  clip?: EditAudioClip;

  constructor(clip?: EditAudioClip) {
    super();
    this.clip = clip;
  }

  get type(): ActionType {
    return ActionTypeValues.PlayAnimation;
  }

  toAction(_editSet: EditDataSet, _set: DataSet): Action {
    return safeAssign(new ActionPlayAudioClip(), {
      clipId: this.clip?.id ?? 0,
    });
  }

  duplicate(): EditAction {
    return new EditActionPlayAudioClip(this.clip);
  }
}
