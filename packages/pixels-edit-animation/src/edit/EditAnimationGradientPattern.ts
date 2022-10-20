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
import { widget, range, units, name } from "./decorators";

export default class EditAnimationGradientPattern extends EditAnimation {
  private _duration: number;

  get type(): AnimationType {
    return AnimationTypeValues.GradientPattern;
  }

  @widget("slider")
  @range(0.1, 30, 0.1)
  @units("s")
  @name("Duration")
  get duration(): number {
    return this._duration;
  }
  set duration(value: number) {
    this._duration = value;
  }

  @widget("grayscalePattern")
  @name("LED Pattern")
  pattern?: EditPattern;

  @widget("gradient")
  @name("RGB Gradient")
  gradient?: EditRgbGradient;

  @name("Override color based on face")
  overrideWithFace: boolean;

  constructor(options?: {
    name?: string;
    duration?: number;
    pattern?: EditPattern;
    gradient?: EditRgbGradient;
    overrideWithFace?: boolean;
  }) {
    super(options?.name);
    this._duration = options?.duration ?? 1;
    this.pattern = options?.pattern;
    this.gradient = options?.gradient;
    this.overrideWithFace = options?.overrideWithFace ?? false;
  }

  toAnimation(editSet: EditDataSet, bits: AnimationBits): AnimationPreset {
    const gradientTrackOffset = bits.rgbTracks.length;
    // Add gradient
    if (this.gradient) {
      bits.rgbTracks.push(
        new EditRgbTrack(this.gradient).toTrack(editSet, bits)
      );
    }

    return safeAssign(new AnimationGradientPattern(), {
      duration: this.duration * 1000, // stored in milliseconds
      tracksOffset: this.pattern
        ? editSet.getPatternTrackOffset(this.pattern)
        : 0,
      trackCount: this.pattern?.gradients.length ?? 0,
      gradientTrackOffset,
      overrideWithFace: this.overrideWithFace ? 1 : 0,
    });
  }

  duplicate(): EditAnimation {
    return new EditAnimationGradientPattern({
      name: this.name,
      duration: this.duration,
      pattern: this.pattern,
      gradient: this.gradient?.duplicate(),
      overrideWithFace: this.overrideWithFace,
    });
  }

  requiresPattern(pattern: EditPattern): { asRgb: boolean } | undefined {
    if (this.pattern === pattern) {
      return { asRgb: false };
    }
  }
}
