import {
  AnimationBits,
  AnimationPreset,
  AnimationKeyframed,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditAnimation, { EditAnimationParams } from "./EditAnimation";
import EditDataSet from "./EditDataSet";
import EditPattern from "./EditPattern";
import { name, observable, widget } from "./decorators";

export default class EditAnimationKeyframed extends EditAnimation {
  readonly type = "keyframed";

  @widget("rgbPattern")
  @name("Color Design")
  @observable
  pattern?: EditPattern;

  constructor(
    opt?: EditAnimationParams & {
      pattern?: EditPattern;
    }
  ) {
    super(opt);
    this.pattern = opt?.pattern;
  }

  toAnimation(editSet: EditDataSet, _bits: AnimationBits): AnimationPreset {
    return safeAssign(new AnimationKeyframed(), {
      animFlags: this.animFlags ? 1 : 0,
      duration: this.duration * 1000, // stored in milliseconds
      tracksOffset: editSet.getPatternRGBTrackOffset(this.pattern),
      trackCount: this.pattern?.gradients.length ?? 0,
    });
  }

  duplicate(uuid?: string): EditAnimation {
    return new EditAnimationKeyframed({
      ...this,
      uuid,
      pattern: this.pattern?.duplicate(),
    });
  }

  collectPatterns(): { rgb?: EditPattern[]; grayscale?: EditPattern[] } {
    return this.pattern ? { rgb: [this.pattern] } : {};
  }
}
