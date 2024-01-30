import {
  DataSet,
  Condition,
  ConditionRolling,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditCondition from "./EditCondition";
import EditDataSet from "./EditDataSet";
import { observable, range, unit, widget } from "./decorators";

export default class EditConditionRolling extends EditCondition {
  readonly type = "rolling";

  @widget("slider")
  @range(0.1, 5, 0.1)
  @unit("s")
  @observable
  recheckAfter: number;

  constructor(opt?: { recheckAfter?: number }) {
    super();
    this.recheckAfter = opt?.recheckAfter ?? 0.5;
  }

  toCondition(_editSet: EditDataSet, _set: DataSet): Condition {
    return safeAssign(new ConditionRolling(), {
      repeatPeriodMs: Math.round(this.recheckAfter * 1000),
    });
  }

  duplicate(): EditCondition {
    return new EditConditionRolling(this);
  }
}
