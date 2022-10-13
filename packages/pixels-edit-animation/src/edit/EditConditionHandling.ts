import {
  DataSet,
  ActionType,
  Condition,
  ConditionTypeValues,
  ConditionHandling,
} from "@systemic-games/pixels-core-animation";
import EditCondition from "./EditCondition";
import EditDataSet from "./EditDataSet";

export default class EditConditionHandling extends EditCondition {
  get type(): ActionType {
    return ConditionTypeValues.Handling;
  }

  toCondition(_editSet: EditDataSet, _set: DataSet): Condition {
    return new ConditionHandling();
  }

  duplicate(): EditCondition {
    return new EditConditionHandling();
  }
}
