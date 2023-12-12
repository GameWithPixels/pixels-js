import {
  DataSet,
  Action,
  ActionPlayAudioClip,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditAction from "./EditAction";
import EditActionRunOnDevice from "./EditActionRunOnDevice";
import EditAudioClip from "./EditAudioClip";
import EditDataSet from "./EditDataSet";
import { name, observable, widget } from "./decorators";

export default class EditActionPlayAudioClip extends EditActionRunOnDevice {
  readonly type = "playAudioClip";

  @widget("audioClip")
  @name("Audio Clip")
  @observable
  clip?: EditAudioClip;

  @observable
  volume: number;

  @observable
  loopCount: number;

  constructor(opt?: {
    clip?: EditAudioClip;
    volume?: number;
    loopCount?: number;
  }) {
    super();
    this.clip = opt?.clip;
    this.volume = opt?.volume ?? 100;
    this.loopCount = opt?.loopCount ?? 1;
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
