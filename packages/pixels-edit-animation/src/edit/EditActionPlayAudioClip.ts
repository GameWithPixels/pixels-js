import {
  DataSet,
  Action,
  ActionPlayAudioClip,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditAction from "./EditAction";
import EditActionRunOnDevice from "./EditActionRunOnDevice";
import EditDataSet from "./EditDataSet";
import { name, observable } from "./decorators";

export default class EditActionPlayAudioClip extends EditActionRunOnDevice {
  readonly type = "playAudioClip";

  // @widget("audioClip")
  @name("Audio Clip")
  @observable
  clipUuid?: string;

  @observable
  volume: number;

  @observable
  loopCount: number;

  constructor(opt?: {
    clipUuid?: string;
    volume?: number;
    loopCount?: number;
  }) {
    super();
    this.clipUuid = opt?.clipUuid;
    this.volume = opt?.volume ?? 1;
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
