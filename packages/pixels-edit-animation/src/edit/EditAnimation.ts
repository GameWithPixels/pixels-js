import {
  AnimationType,
  AnimationBits,
  AnimationPreset,
} from "@systemic-games/pixels-core-animation";

import EditDataSet from "./EditDataSet";
import EditPattern from "./EditPattern";
import Editable from "./Editable";

export default abstract class EditAnimation extends Editable {
  name: string;

  abstract get type(): AnimationType;

  // Float, in seconds
  abstract get duration(): number;
  abstract set duration(value: number);

  constructor(name = "") {
    super();
    this.name = name;
  }

  abstract toAnimation(
    editSet: EditDataSet,
    bits: AnimationBits
  ): AnimationPreset;
  abstract duplicate(): EditAnimation;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  requiresPattern(pattern: EditPattern): { asRgb: boolean } | undefined {
    return undefined;
  }
}
