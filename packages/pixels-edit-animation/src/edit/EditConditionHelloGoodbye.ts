import {
  DataSet,
  ActionType,
  Condition,
  ConditionTypeValues,
  ConditionHelloGoodbye,
  HelloGoodbyeFlags,
  HelloGoodbyeFlagsValues,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditCondition from "./EditCondition";
import EditDataSet from "./EditDataSet";
import { name, values, widget } from "./decorators";

export default class EditConditionHelloGoodbye extends EditCondition {
  get type(): ActionType {
    return ConditionTypeValues.HelloGoodbye;
  }

  @widget("bitField")
  @name("Hello / Goodbye")
  @values(HelloGoodbyeFlagsValues)
  flags: HelloGoodbyeFlags;

  constructor(flags: HelloGoodbyeFlags = 0) {
    super();
    this.flags = flags;
  }

  toCondition(_editSet: EditDataSet, _set: DataSet): Condition {
    return safeAssign(new ConditionHelloGoodbye(), {
      flags: this.flags,
    });
  }

  duplicate(): EditCondition {
    return new EditConditionHelloGoodbye(this.flags);
  }
}
