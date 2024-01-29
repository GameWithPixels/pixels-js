import {
  AnimationBits,
  AnimationPreset,
  AnimationGradient,
  Constants,
  AnimationCategory,
  PixelDieType,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditAnimation from "./EditAnimation";
import EditDataSet from "./EditDataSet";
import EditRgbGradient from "./EditRgbGradient";
import EditRgbTrack from "./EditRgbTrack";
import { widget, name, observable } from "./decorators";

export default class EditAnimationGradient extends EditAnimation {
  readonly type = "gradient";

  @widget("gradient")
  @name("Gradient")
  @observable
  gradient?: EditRgbGradient;

  @widget("faceMask")
  @name("Face Mask")
  @observable
  faces: number;

  constructor(opt?: {
    uuid?: string;
    name?: string;
    animFlags?: number;
    duration?: number;
    category?: AnimationCategory;
    dieType?: PixelDieType;
    faces?: number;
    gradient?: EditRgbGradient;
  }) {
    super(opt);
    this.faces = opt?.faces ?? Constants.faceMaskAll;
    this.gradient = opt?.gradient;
  }

  toAnimation(editSet: EditDataSet, bits: AnimationBits): AnimationPreset {
    // Add gradient
    const gradientTrackOffset = bits.rgbTracks.length;
    if (this.gradient) {
      bits.rgbTracks.push(
        new EditRgbTrack({ gradient: this.gradient }).toTrack(editSet, bits)
      );
    }

    return safeAssign(new AnimationGradient(), {
      duration: this.duration * 1000,
      faceMask: this.faces,
      gradientTrackOffset,
    });
  }

  duplicate(uuid?: string): EditAnimation {
    return new EditAnimationGradient({ ...this, uuid });
  }
}
