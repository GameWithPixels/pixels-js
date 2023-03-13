import {
  AnimationType,
  AnimationTypeValues,
  AnimationBits,
  AnimationPreset,
  AnimationKeyframed,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditAnimation from "./EditAnimation";
import EditDataSet from "./EditDataSet";
import EditPattern from "./EditPattern";
import { name, observable, widget } from "./decorators";

export default class EditAnimationKeyframed extends EditAnimation {
  get type(): AnimationType {
    return AnimationTypeValues.keyframed;
  }

  @widget("rgbPattern")
  @name("LED Pattern")
  @observable
  pattern?: EditPattern;

  @widget("toggle")
  @name("Traveling Order")
  @observable
  traveling: boolean;

  constructor(opt?: {
    uuid?: string;
    name?: string;
    duration?: number;
    pattern?: EditPattern;
    traveling?: boolean;
  }) {
    super(opt);
    this.pattern = opt?.pattern;
    this.traveling = opt?.traveling ?? false;
  }

  toAnimation(editSet: EditDataSet, _bits: AnimationBits): AnimationPreset {
    return safeAssign(new AnimationKeyframed(), {
      duration: this.duration * 1000, // stored in milliseconds
      tracksOffset: editSet.getPatternRGBTrackOffset(this.pattern),
      trackCount: this.pattern?.gradients.length ?? 0,
      flowOrder: this.traveling ? 1 : 0,
    });
  }

  duplicate(uuid?: string): EditAnimation {
    return new EditAnimationKeyframed({ ...this, uuid });
  }

  collectPatterns(): { rgb?: EditPattern[]; grayscale?: EditPattern[] } {
    if (this.pattern) {
      return { rgb: [this.pattern] };
    } else {
      return {};
    }
  }
}
