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
import { range, units, widget } from "./decorators";

export default class EditConditionIdle extends EditCondition {
  get type(): ActionType {
    return ConditionTypeValues.Idle;
  }

  @widget("slider")
  @range(0.5, 30, 0.5)
  @units("s")
  period: number;

  constructor(period = 10) {
    super();
    this.period = period;
  }

  toCondition(_editSet: EditDataSet, _set: DataSet): Condition {
    return safeAssign(new ConditionIdle(), {
      repeatPeriodMs: Math.round(this.period * 1000),
    });
  }

  duplicate(): EditCondition {
    return new EditConditionIdle(this.period);
  }
}
