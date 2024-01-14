import {
  DataSet,
  Condition,
  ConditionRolled,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditCondition from "./EditCondition";
import EditDataSet from "./EditDataSet";
import { observable } from "./decorators";

export default class EditConditionRolled extends EditCondition {
  readonly type = "rolled";

  // @widget("faces")
  // @range(1, 20)
  // @name("Faces")
  @observable
  faces: number[];

  constructor(opt?: { faces?: number[] }) {
    super();
    this.faces = opt?.faces ?? [];
  }

  toCondition(_editSet: EditDataSet, _set: DataSet): Condition {
    return safeAssign(new ConditionRolled(), {
      faceMask: EditConditionRolled.toFaceMask(this.faces),
    });
  }

  duplicate(): EditCondition {
    return new EditConditionRolled({
      faces: [...this.faces],
    });
  }

  static toFaceMask(faces: number[]): number {
    let mask = 0;
    for (const face of faces) {
      mask |= 1 << (face - 1);
    }
    return mask;
  }

  static fromFaceMask(mask: number): number[] {
    const faces = [];
    let face = 1;
    while (mask) {
      if (mask & 1) {
        faces.push(face);
      }
      mask = mask >> 1;
      ++face;
    }
    return faces;
  }
}
