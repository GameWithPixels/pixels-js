import {
  DataSet,
  Condition,
  ConditionHandling,
} from "@systemic-games/pixels-core-animation";

import EditCondition from "./EditCondition";
import EditDataSet from "./EditDataSet";

export default class EditConditionHandling extends EditCondition {
  readonly type = "handling";

  toCondition(_editSet: EditDataSet, _set: DataSet): Condition {
    return new ConditionHandling();
  }

  duplicate(): EditCondition {
    return new EditConditionHandling();
  }
}
