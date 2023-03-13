import {
  DataSet,
  ActionType,
  Condition,
  ConditionTypeValues,
  ConditionIdle,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditCondition from "./EditCondition";
import EditDataSet from "./EditDataSet";
import { observable, range, unit, widget } from "./decorators";

export default class EditConditionIdle extends EditCondition {
  get type(): ActionType {
    return ConditionTypeValues.idle;
  }

  @widget("slider")
  @range(0.5, 30, 0.5)
  @unit("s")
  @observable
  period: number;

  constructor(opt?: { period?: number }) {
    super();
    this.period = opt?.period ?? 10;
  }

  toCondition(_editSet: EditDataSet, _set: DataSet): Condition {
    return safeAssign(new ConditionIdle(), {
      repeatPeriodMs: Math.round(this.period * 1000),
    });
  }

  duplicate(): EditCondition {
    return new EditConditionIdle(this);
  }
}
