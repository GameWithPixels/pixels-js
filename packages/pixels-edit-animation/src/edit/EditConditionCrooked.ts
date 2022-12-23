import {
  DataSet,
  ActionType,
  Condition,
  ConditionTypeValues,
  ConditionCrooked,
} from "@systemic-games/pixels-core-animation";

import EditCondition from "./EditCondition";
import EditDataSet from "./EditDataSet";

export default class EditConditionCrooked extends EditCondition {
  get type(): ActionType {
    return ConditionTypeValues.crooked;
  }

  toCondition(_editSet: EditDataSet, _set: DataSet): Condition {
    return new ConditionCrooked();
  }

  duplicate(): EditCondition {
    return new EditConditionCrooked();
  }
}
