import {
  DataSet,
  Action,
  ActionPlayAudioClip,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditCompositeCondition from "./EditCompositeCondition";
import EditDataSet from "./EditDataSet";
import { observable } from "./decorators";

export default class EditCompositeConditionResult extends EditCompositeCondition {
  readonly type = "result";

  @observable
  value: number;

  constructor(opt?: { value?: number }) {
    super();
    this.value = opt?.value ?? 0;
  }

  toAction(_editSet: EditDataSet, _set: DataSet, actionId: number): Action {
    return safeAssign(new ActionPlayAudioClip(), {
      actionId,
    });
  }

  duplicate(): EditCompositeCondition {
    return new EditCompositeConditionResult(this);
  }
}
