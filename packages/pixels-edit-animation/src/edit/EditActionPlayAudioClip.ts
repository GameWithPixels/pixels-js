import {
  DataSet,
  ActionType,
  ActionTypeValues,
  Action,
  ActionPlayAudioClip,
  RemoteActionType,
  RemoteActionTypeValues,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditAction from "./EditAction";
import EditActionRunOnDevice from "./EditActionRunOnDevice";
import EditAudioClip from "./EditAudioClip";
import EditDataSet from "./EditDataSet";
import { name, observable, widget } from "./decorators";

export default class EditActionPlayAudioClip extends EditActionRunOnDevice {
  @widget("audioClip")
  @name("Audio Clip")
  @observable
  clip?: EditAudioClip;

  constructor(opt?: { clip?: EditAudioClip }) {
    super();
    this.clip = opt?.clip;
  }

  get type(): ActionType {
    return ActionTypeValues.runOnDevice;
  }

  get remoteType(): RemoteActionType {
    return RemoteActionTypeValues.playAudioClip;
  }

  toAction(_editSet: EditDataSet, _set: DataSet, actionId: number): Action {
    return safeAssign(new ActionPlayAudioClip(), {
      actionId,
    });
  }

  duplicate(): EditAction {
    return new EditActionPlayAudioClip(this);
  }
}
