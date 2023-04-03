import {
  DataSet,
  Condition,
  ConditionBatteryState,
  BatteryStateFlagsValues,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditCondition from "./EditCondition";
import EditDataSet from "./EditDataSet";
import { name, widget, range, unit, values, observable } from "./decorators";

export default class EditConditionBatteryState extends EditCondition {
  readonly type = "batteryState";

  @widget("bitField")
  @name("Battery State")
  @values(BatteryStateFlagsValues)
  @observable
  flags: number;

  @widget("slider")
  @range(5, 60)
  @unit("s")
  @observable
  recheckAfter: number;

  constructor(opt?: { flags?: number; recheckAfter?: number }) {
    super();
    this.flags = opt?.flags ?? 0;
    this.recheckAfter = opt?.recheckAfter ?? 1;
  }

  toCondition(_editSet: EditDataSet, _set: DataSet): Condition {
    return safeAssign(new ConditionBatteryState(), {
      flags: this.flags,
      repeatPeriodMs: Math.round(this.recheckAfter * 1000),
    });
  }

  duplicate(): EditCondition {
    return new EditConditionBatteryState(this);
  }
}
