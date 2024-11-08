import {
  AnimationBits,
  AnimationPreset,
  AnimationGradient,
  AnimConstants,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditAnimation, { EditAnimationParams } from "./EditAnimation";
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
  faceMask: number;

  constructor(
    opt?: EditAnimationParams & {
      gradient?: EditRgbGradient;
      faceMask?: number;
    }
  ) {
    super(opt);
    this.gradient = opt?.gradient;
    this.faceMask = opt?.faceMask ?? AnimConstants.faceMaskAll;
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
      faceMask: this.faceMask,
      gradientTrackOffset,
    });
  }

  duplicate(uuid?: string): EditAnimation {
    return new EditAnimationGradient({
      ...this,
      uuid,
      gradient: this.gradient?.duplicate(),
    });
  }

  collectGradients(): EditRgbGradient[] {
    return this.gradient ? [this.gradient] : [];
  }
}
