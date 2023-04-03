import {
  DataSet,
  Condition,
  ConditionCrooked,
} from "@systemic-games/pixels-core-animation";

import EditCondition from "./EditCondition";
import EditDataSet from "./EditDataSet";

export default class EditConditionCrooked extends EditCondition {
  readonly type = "crooked";

  toCondition(_editSet: EditDataSet, _set: DataSet): Condition {
    return new ConditionCrooked();
  }

  duplicate(): EditCondition {
    return new EditConditionCrooked();
  }
}
