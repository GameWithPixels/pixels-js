import {
  DataSet,
  Condition,
  ConditionConnectionState,
  ConnectionStateFlagsValues,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditCondition from "./EditCondition";
import EditDataSet from "./EditDataSet";
import { name, observable, values, widget } from "./decorators";

export default class EditConditionConnectionState extends EditCondition {
  readonly type = "connection";

  @widget("bitField")
  @name("Connection Event")
  @values(ConnectionStateFlagsValues)
  @observable
  flags: number;

  get flagName(): string | undefined {
    return this.getFlagName(this.flags, ConnectionStateFlagsValues);
  }

  constructor(opt?: { flags?: number }) {
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
