import {
  DataSet,
  Condition,
  ConditionFaceCompare,
  FaceCompareFlagsValues,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditCondition from "./EditCondition";
import EditDataSet from "./EditDataSet";
import { name, observable, range, values, widget } from "./decorators";

export default class EditConditionFaceCompare extends EditCondition {
  readonly type = "rolled";

  @widget("bitField")
  @name("Comparison")
  @values(FaceCompareFlagsValues)
  @observable
  flags: number;

  @widget("face")
  @range(1, 20)
  @name("Than")
  @observable
  face: number; // Face value

  constructor(opt?: { flags?: number; face?: number }) {
    super();
    this.flags = opt?.flags ?? 0;
    this.face = opt?.face ?? 1;
  }

  toCondition(_editSet: EditDataSet, _set: DataSet): Condition {
    return safeAssign(new ConditionFaceCompare(), {
      faceIndex: this.face > 0 ? this.face - 1 : this.face,
      flags: this.flags,
    });
  }

  duplicate(): EditCondition {
    return new EditConditionFaceCompare(this);
  }
}
