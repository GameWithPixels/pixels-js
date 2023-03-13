import {
  AnimationBits,
  Track,
  RgbTrack,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditDataSet from "./EditDataSet";
import EditRgbGradient from "./EditRgbGradient";
import Editable from "./Editable";
import { observable } from "./decorators";

export default class EditPattern extends Editable {
  @observable
  gradients: EditRgbGradient[];

  get duration(): number {
    return this.gradients.length
      ? Math.max(...this.gradients.map((g) => g.duration))
      : 1;
  }

  constructor(opt?: {
    uuid?: string;
    name?: string;
    gradients?: EditRgbGradient[];
  }) {
    super(opt);
    this.gradients = opt?.gradients ?? [];
  }

  toRgbTracks(editSet: EditDataSet, bits: AnimationBits): RgbTrack[] {
    return this.gradients.map((gradient, i) => {
      // Add the keyframes
      const keyframesOffset = bits.rgbKeyframes.length;
      bits.rgbKeyframes.push(
        ...gradient.keyframes.map((kf) => kf.toRgbKeyframe(editSet, bits))
      );
      return safeAssign(new RgbTrack(), {
        keyframesOffset,
        keyFrameCount: gradient.keyframes.length,
        ledMask: 1 << i,
      });
    });
  }

  toTracks(editSet: EditDataSet, bits: AnimationBits): Track[] {
    return this.gradients.map((gradient, i) => {
      // Add the keyframes
      const keyframesOffset = bits.keyframes.length;
      bits.keyframes.push(
        ...gradient.keyframes.map((kf) => kf.toKeyframe(editSet, bits))
      );
      return safeAssign(new Track(), {
        keyframesOffset,
        keyFrameCount: gradient.keyframes.length,
        ledMask: 1 << i,
      });
    });
  }
}
