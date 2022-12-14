import {
  DataSet,
  ActionType,
  ConditionTypeValues,
  Condition,
  ConditionConnectionState,
  ConnectionStateFlags,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditCondition from "./EditCondition";
import EditDataSet from "./EditDataSet";
import { name, widget } from "./decorators";

export default class EditConditionConnectionState extends EditCondition {
  get type(): ActionType {
    return ConditionTypeValues.ConnectionState;
  }

  @widget("bitField")
  @name("Connection Event")
  flags: ConnectionStateFlags;

  constructor(flags: ConnectionStateFlags = 0) {
    super();
    this.flags = flags;
  }

  toCondition(_editSet: EditDataSet, _set: DataSet): Condition {
    return safeAssign(new ConditionConnectionState(), {
      flags: this.flags,
    });
  }

  duplicate(): EditCondition {
    return new EditConditionConnectionState(this.flags);
  }
}
