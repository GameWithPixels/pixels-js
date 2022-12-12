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
import { widget, range, name } from "./decorators";

export default class EditAnimationGradient extends EditAnimation {
  get type(): AnimationType {
    return AnimationTypeValues.Gradient;
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
    super(options?.name, options?.duration ?? 1);
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
