import {
  AnimationType,
  AnimationTypeValues,
  AnimationBits,
  AnimationPreset,
  AnimationGradientPattern,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditAnimation from "./EditAnimation";
import EditDataSet from "./EditDataSet";
import EditPattern from "./EditPattern";
import EditRgbGradient from "./EditRgbGradient";
import EditRgbTrack from "./EditRgbTrack";
import { widget, name, observable } from "./decorators";

export default class EditAnimationGradientPattern extends EditAnimation {
  get type(): AnimationType {
    return AnimationTypeValues.gradientPattern;
  }

  @widget("grayscalePattern")
  @name("LED Pattern")
  @observable
  pattern?: EditPattern;

  @widget("gradient")
  @name("RGB Gradient")
  @observable
  gradient?: EditRgbGradient;

  @widget("toggle")
  @name("Override color based on face")
  @observable
  overrideWithFace: boolean;

  constructor(opt?: {
    uuid?: string;
    name?: string;
    duration?: number;
    pattern?: EditPattern;
    gradient?: EditRgbGradient;
    overrideWithFace?: boolean;
  }) {
    super(opt);
    this.pattern = opt?.pattern;
    this.gradient = opt?.gradient;
    this.overrideWithFace = opt?.overrideWithFace ?? false;
  }

  toAnimation(editSet: EditDataSet, bits: AnimationBits): AnimationPreset {
    const gradientTrackOffset = bits.rgbTracks.length;
    // Add gradient
    if (this.gradient) {
      bits.rgbTracks.push(
        new EditRgbTrack({ gradient: this.gradient }).toTrack(editSet, bits)
      );
    }

    return safeAssign(new AnimationGradientPattern(), {
      duration: this.duration * 1000, // stored in milliseconds
      tracksOffset: this.pattern
        ? editSet.getPatternTrackOffset(this.pattern)
        : 0,
      trackCount: this.pattern?.gradients.length ?? 0,
      gradientTrackOffset,
      overrideWithFace: this.overrideWithFace,
    });
  }

  duplicate(uuid?: string): EditAnimation {
    return new EditAnimationGradientPattern({ ...this, uuid });
  }

  collectPatterns(): { rgb?: EditPattern[]; grayscale?: EditPattern[] } {
    if (this.pattern) {
      return { grayscale: [this.pattern] };
    } else {
      return {};
    }
  }
}
