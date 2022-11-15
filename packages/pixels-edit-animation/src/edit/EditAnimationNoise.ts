import {
  AnimationType,
  AnimationTypeValues,
  AnimationBits,
  AnimationPreset,
  AnimationNoise,
  Constants,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditAnimation from "./EditAnimation";
import EditDataSet from "./EditDataSet";
import EditRgbGradient from "./EditRgbGradient";
import EditRgbTrack from "./EditRgbTrack";
import { widget, range, units, name } from "./decorators";

export default class EditAnimationNoise extends EditAnimation {
  private _duration: number;

  get type(): AnimationType {
    return AnimationTypeValues.Noise;
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

  @widget("gradient")
  @name("Overall Gradient")
  gradient?: EditRgbGradient;

  @widget("faceMask")
  @range(0, 19, 1)
  @name("Face Mask")
  faces: number;

  @widget("slider")
  @range(0.001, 0.1)
  @name("Blink Duration Ratio")
  blinkDuration: number;

  @widget("gradient")
  @name("Individual Gradient")
  blinkGradient?: EditRgbGradient;

  @widget("slider")
  @range(10, 100)
  @name("Blink Count")
  blinkCount: number;

  @widget("slider")
  @range(0, 1)
  @name("Fading Sharpness")
  fade: number;

  constructor(options?: {
    name?: string;
    duration?: number;
    gradient?: EditRgbGradient;
    faces?: number;
    blinkDuration?: number;
    blinkGradient?: EditRgbGradient;
    blinkCount?: number;
    fade?: number;
  }) {
    super(options?.name);
    this._duration = options?.duration ?? 1;
    this.gradient = options?.gradient;
    this.faces = options?.faces ?? Constants.faceMaskAllLEDs;
    this.blinkDuration = options?.blinkDuration ?? 0.1;
    this.blinkGradient = options?.blinkGradient;
    this.blinkCount = options?.blinkCount ?? 10;
    this.fade = options?.fade ?? 0;
  }

  toAnimation(editSet: EditDataSet, bits: AnimationBits): AnimationPreset {
    // Add gradient
    const gradientTrackOffset = bits.rgbTracks.length;
    if (this.gradient) {
      bits.rgbTracks.push(
        new EditRgbTrack(this.gradient).toTrack(editSet, bits)
      );
    }
    const blinkTrackOffset = bits.rgbTracks.length;
    if (this.blinkGradient) {
      bits.rgbTracks.push(
        new EditRgbTrack(this.blinkGradient).toTrack(editSet, bits)
      );
    }

    return safeAssign(new AnimationNoise(), {
      duration: this.duration * 1000,
      gradientTrackOffset,
      blinkTrackOffset,
      blinkCount: this.blinkCount,
      blinkDuration: this.blinkDuration * 255,
      fade: this.fade * 255,
      faceMask: this.faces,
    });
  }

  duplicate(): EditAnimation {
    return new EditAnimationNoise({
      name: this.name,
      duration: this.duration,
      gradient: this.gradient?.duplicate(),
      faces: this.faces,
      blinkDuration: this.blinkDuration,
      blinkGradient: this.blinkGradient,
      blinkCount: this.blinkCount,
      fade: this.fade,
    });
  }
}
