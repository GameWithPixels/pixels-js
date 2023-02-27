import {
  DataSet,
  ActionType,
  ConditionTypeValues,
  Condition,
  BatteryStateFlags,
  ConditionBatteryState,
  BatteryStateFlagsValues,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditCondition from "./EditCondition";
import EditDataSet from "./EditDataSet";
import { name, widget, range, unit, values } from "./decorators";

export default class EditConditionBatteryState extends EditCondition {
  get type(): ActionType {
    return ConditionTypeValues.batteryState;
  }

  @widget("bitField")
  @name("Battery State")
  @values(BatteryStateFlagsValues)
  flags: BatteryStateFlags;

  @widget("slider")
  @range(5, 60)
  @unit("s")
  recheckAfter: number;

  constructor(opt?: { flags?: BatteryStateFlags; recheckAfter?: number }) {
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
