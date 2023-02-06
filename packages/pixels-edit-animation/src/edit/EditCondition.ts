import {
  DataSet,
  ConditionType,
  Condition,
} from "@systemic-games/pixels-core-animation";

import EditDataSet from "./EditDataSet";
import Editable from "./Editable";

export default abstract class EditCondition extends Editable {
  abstract get type(): ConditionType;
  abstract toCondition(editSet: EditDataSet, set: DataSet): Condition;
  abstract duplicate(): EditCondition;
}
