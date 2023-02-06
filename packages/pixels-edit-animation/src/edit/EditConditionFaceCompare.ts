import {
  DataSet,
  ActionType,
  Condition,
  ConditionTypeValues,
  ConditionFaceCompare,
  FaceCompareFlags,
  FaceCompareFlagsValues,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditCondition from "./EditCondition";
import EditDataSet from "./EditDataSet";
import { name, range, values, widget } from "./decorators";

export default class EditConditionFaceCompare extends EditCondition {
  get type(): ActionType {
    return ConditionTypeValues.faceCompare;
  }

  @widget("bitField")
  @name("Comparison")
  @values(FaceCompareFlagsValues)
  flags: FaceCompareFlags;

  @widget("face")
  @range(0, 19)
  @name("Than")
  face: number; // Face value

  constructor(flags: FaceCompareFlags = 0, face = 0) {
    super();
    this.flags = flags;
    this.face = face;
  }

  toCondition(_editSet: EditDataSet, _set: DataSet): Condition {
    return safeAssign(new ConditionFaceCompare(), {
      faceIndex: this.face > 0 ? this.face - 1 : this.face,
      flags: this.flags,
    });
  }

  duplicate(): EditCondition {
    return new EditConditionFaceCompare(this.flags, this.face);
  }
}
