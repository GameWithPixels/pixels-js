import {
  DataSet,
  Condition,
  ConditionHelloGoodbye,
  HelloGoodbyeFlagsValues,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditCondition from "./EditCondition";
import EditDataSet from "./EditDataSet";
import { name, observable, values, widget } from "./decorators";

export default class EditConditionHelloGoodbye extends EditCondition {
  readonly type = "helloGoodbye";

  @widget("bitField")
  @name("Hello / Goodbye")
  @values(HelloGoodbyeFlagsValues)
  @observable
  flags: number;

  get flagName(): string | undefined {
    return this.getFlagName(this.flags, HelloGoodbyeFlagsValues);
  }

  constructor(opt?: { flags?: number }) {
    super();
    this.flags = opt?.flags ?? 0;
  }

  toCondition(_editSet: EditDataSet, _set: DataSet): Condition {
    return safeAssign(new ConditionHelloGoodbye(), {
      flags: this.flags,
    });
  }

  duplicate(): EditCondition {
    return new EditConditionHelloGoodbye(this);
  }
}
