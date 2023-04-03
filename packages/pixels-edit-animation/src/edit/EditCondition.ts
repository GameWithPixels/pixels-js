import {
  DataSet,
  ConditionType,
  Condition,
} from "@systemic-games/pixels-core-animation";

import EditDataSet from "./EditDataSet";

export default abstract class EditCondition {
  abstract readonly type: ConditionType;
  abstract toCondition(editSet: EditDataSet, set: DataSet): Condition;
  abstract duplicate(): EditCondition;
}
