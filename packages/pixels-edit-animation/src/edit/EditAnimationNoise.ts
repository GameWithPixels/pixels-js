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
import { widget, range, name } from "./decorators";

export default class EditAnimationNoise extends EditAnimation {
  get type(): AnimationType {
    return AnimationTypeValues.noise;
  }

  @widget("gradient")
  @name("Overall Gradient")
  gradient?: EditRgbGradient;

  @widget("faceMask")
  @range(1, 20, 1)
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

  constructor(opt?: {
    uuid?: string;
    name?: string;
    duration?: number;
    gradient?: EditRgbGradient;
    faces?: number;
    blinkDuration?: number;
    blinkGradient?: EditRgbGradient;
    blinkCount?: number;
    fade?: number;
  }) {
    super(opt);
    this.gradient = opt?.gradient;
    this.faces = opt?.faces ?? Constants.faceMaskAllLEDs;
    this.blinkDuration = opt?.blinkDuration ?? 0.1;
    this.blinkGradient = opt?.blinkGradient;
    this.blinkCount = opt?.blinkCount ?? 10;
    this.fade = opt?.fade ?? 0;
  }

  toAnimation(editSet: EditDataSet, bits: AnimationBits): AnimationPreset {
    // Add gradient
    const gradientTrackOffset = bits.rgbTracks.length;
    if (this.gradient) {
      const track = new EditRgbTrack({ gradient: this.gradient });
      bits.rgbTracks.push(track.toTrack(editSet, bits));
    }
    const blinkTrackOffset = bits.rgbTracks.length;
    if (this.blinkGradient) {
      const track = new EditRgbTrack({ gradient: this.blinkGradient });
      bits.rgbTracks.push(track.toTrack(editSet, bits));
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

  duplicate(uuid?: string): EditAnimation {
    return new EditAnimationNoise({ ...this, uuid });
  }
}
