import {
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
import { widget, range, name, observable } from "./decorators";

export default class EditAnimationNoise extends EditAnimation {
  readonly type = "noise";

  @widget("gradient")
  @name("Overall Gradient")
  @observable
  gradient?: EditRgbGradient;

  @widget("slider")
  @range(0.001, 0.1)
  @name("Blink Duration Ratio")
  @observable
  blinkDuration: number;

  @widget("gradient")
  @name("Individual Gradient")
  @observable
  blinkGradient?: EditRgbGradient;

  @widget("slider")
  @range(10, 100)
  @name("Blink Count")
  @observable
  blinkCount: number;

  @widget("slider")
  @range(0, 1)
  @name("Fading Sharpness")
  @observable
  fade: number;

  @widget("faceMask")
  @name("Face Mask")
  @observable
  faces: number;

  constructor(opt?: {
    uuid?: string;
    name?: string;
    duration?: number;
    animFlags?: number;
    gradient?: EditRgbGradient;
    faces?: number;
    blinkDuration?: number;
    blinkGradient?: EditRgbGradient;
    blinkCount?: number;
    fade?: number;
  }) {
    super(opt);
    this.gradient = opt?.gradient;
    this.faces = opt?.faces ?? Constants.faceMaskAll;
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
