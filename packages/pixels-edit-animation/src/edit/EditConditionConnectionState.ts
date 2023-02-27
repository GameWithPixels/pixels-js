import {
  DataSet,
  ActionType,
  ConditionTypeValues,
  Condition,
  ConditionConnectionState,
  ConnectionStateFlags,
  ConnectionStateFlagsValues,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditCondition from "./EditCondition";
import EditDataSet from "./EditDataSet";
import { name, values, widget } from "./decorators";

export default class EditConditionConnectionState extends EditCondition {
  get type(): ActionType {
    return ConditionTypeValues.connectionState;
  }

  @widget("bitField")
  @name("Connection Event")
  @values(ConnectionStateFlagsValues)
  flags: ConnectionStateFlags;

  constructor(opt?: { flags?: ConnectionStateFlags }) {
    super();
    this.flags = opt?.flags ?? 0;
  }

  toCondition(_editSet: EditDataSet, _set: DataSet): Condition {
    return safeAssign(new ConditionConnectionState(), {
      flags: this.flags,
    });
  }

  duplicate(): EditCondition {
    return new EditConditionConnectionState(this);
  }
}
