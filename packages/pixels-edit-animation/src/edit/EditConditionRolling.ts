import {
  DataSet,
  ActionType,
  Condition,
  ConditionTypeValues,
  ConditionRolling,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditCondition from "./EditCondition";
import EditDataSet from "./EditDataSet";
import { range, unit, widget } from "./decorators";

export default class EditConditionRolling extends EditCondition {
  get type(): ActionType {
    return ConditionTypeValues.Rolling;
  }

  @widget("slider")
  @range(0.5, 5, 0.1)
  @unit("s")
  recheckAfter: number;

  constructor(recheckAfter = 1) {
    super();
    this.recheckAfter = recheckAfter;
  }

  toCondition(_editSet: EditDataSet, _set: DataSet): Condition {
    return safeAssign(new ConditionRolling(), {
      repeatPeriodMs: Math.round(this.recheckAfter * 1000),
    });
  }

  duplicate(): EditCondition {
    return new EditConditionRolling(this.recheckAfter);
  }
}
