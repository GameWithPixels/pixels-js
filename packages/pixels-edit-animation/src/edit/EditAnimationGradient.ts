import {
  AnimationType,
  AnimationTypeValues,
  AnimationBits,
  AnimationPreset,
  AnimationGradient,
  Constants,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditAnimation from "./EditAnimation";
import EditDataSet from "./EditDataSet";
import EditRgbGradient from "./EditRgbGradient";
import EditRgbTrack from "./EditRgbTrack";
import { widget, range, units, name } from "./decorators";

export default class EditAnimationGradient extends EditAnimation {
  private _duration: number;

  get type(): AnimationType {
    return AnimationTypeValues.Gradient;
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

  @widget("faceMask")
  @range(0, 19, 1)
  @name("Face Mask")
  faces: number;

  @widget("gradient")
  @name("Gradient")
  gradient?: EditRgbGradient;

  constructor(options?: {
    name?: string;
    duration?: number;
    faces?: number;
    gradient?: EditRgbGradient;
  }) {
    super(options?.name);
    this._duration = options?.duration ?? 1;
    this.faces = options?.faces ?? Constants.faceMaskAllLEDs;
    this.gradient = options?.gradient;
  }

  toAnimation(editSet: EditDataSet, bits: AnimationBits): AnimationPreset {
    // Add gradient
    const gradientTrackOffset = bits.rgbTracks.length;
    if (this.gradient) {
      bits.rgbTracks.push(
        new EditRgbTrack(this.gradient).toTrack(editSet, bits)
      );
    }

    return safeAssign(new AnimationGradient(), {
      duration: this.duration * 1000,
      faceMask: this.faces,
      gradientTrackOffset,
    });
  }

  duplicate(): EditAnimation {
    return new EditAnimationGradient({
      name: this.name,
      duration: this.duration,
      faces: this.faces,
      gradient: this.gradient?.duplicate(),
    });
  }
}
