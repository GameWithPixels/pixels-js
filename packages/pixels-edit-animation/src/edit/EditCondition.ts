import {
  DataSet,
  ActionType,
  Condition,
} from "@systemic-games/pixels-core-animation";
import EditDataSet from "./EditDataSet";
import Editable from "./Editable";

export default abstract class EditCondition extends Editable {
  abstract get type(): ActionType;
  abstract toCondition(editSet: EditDataSet, set: DataSet): Condition;
  abstract duplicate(): EditCondition;
}
