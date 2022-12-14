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
import { name, widget } from "./decorators";

export default class EditAnimationKeyframed extends EditAnimation {
  get type(): AnimationType {
    return AnimationTypeValues.Keyframed;
  }

  @widget("rgbPattern")
  @name("LED Pattern")
  pattern?: EditPattern;

  @widget("toggle")
  @name("Traveling Order")
  travelingOrder: boolean;

  constructor(options?: {
    name?: string;
    duration?: number;
    pattern?: EditPattern;
    travelingOrder?: boolean;
  }) {
    super(options?.name, options?.duration ?? 1);
    this.pattern = options?.pattern;
    this.travelingOrder = options?.travelingOrder ?? false;
  }

  toAnimation(editSet: EditDataSet, _bits: AnimationBits): AnimationPreset {
    return safeAssign(new AnimationKeyframed(), {
      duration: this.duration * 1000, // stored in milliseconds
      tracksOffset: editSet.getPatternRGBTrackOffset(this.pattern),
      trackCount: this.pattern?.gradients.length ?? 0,
      flowOrder: this.travelingOrder ? 1 : 0,
    });
  }

  duplicate(): EditAnimation {
    return new EditAnimationKeyframed({
      name: this.name,
      duration: this.duration,
      pattern: this.pattern,
      travelingOrder: this.travelingOrder,
    });
  }

  requiresPattern(pattern: EditPattern): { asRgb: boolean } | undefined {
    if (this.pattern === pattern) {
      return { asRgb: true };
    }
  }
}
