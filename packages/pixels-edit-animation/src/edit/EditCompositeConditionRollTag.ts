import {
  DataSet,
  Action,
  ActionPlayAudioClip,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditCompositeCondition from "./EditCompositeCondition";
import EditDataSet from "./EditDataSet";
import { observable } from "./decorators";

export default class EditCompositeConditionRollTag extends EditCompositeCondition {
  readonly type = "rollTag";

  @observable
  tag: string;

  constructor(opt?: { tag?: string }) {
    super();
    this.tag = opt?.tag ?? "";
  }

  toAction(_editSet: EditDataSet, _set: DataSet, actionId: number): Action {
    return safeAssign(new ActionPlayAudioClip(), {
      actionId,
    });
  }

  duplicate(): EditCompositeCondition {
    return new EditCompositeConditionRollTag(this);
  }
}
