import { AnimationBits, RgbTrack } from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditDataSet from "./EditDataSet";
import EditRgbGradient from "./EditRgbGradient";
import Editable from "./Editable";

export default class EditRgbTrack extends Editable {
  readonly ledIndices: number[] = [];
  readonly gradient: EditRgbGradient;

  get empty(): boolean {
    return this.gradient.empty;
  }

  get duration(): number {
    return this.gradient.duration;
  }
  get firstTime(): number {
    return this.gradient.firstTime;
  }
  get lastTime(): number {
    return this.gradient.lastTime;
  }

  constructor(gradient: EditRgbGradient = new EditRgbGradient()) {
    super();
    this.gradient = gradient;
  }

  toTrack(editSet: EditDataSet, bits: AnimationBits): RgbTrack {
    // Add the keyframes
    const keyframesOffset = bits.rgbKeyframes.length;
    this.gradient.keyframes.forEach((editKeyframe) =>
      bits.rgbKeyframes.push(editKeyframe.toRgbKeyframe(editSet, bits))
    );
    return safeAssign(new RgbTrack(), {
      keyframesOffset,
      keyFrameCount: this.gradient.keyframes.length,
      ledMask: this.ledIndices.reduce((acc, index) => acc | (1 << index), 0),
    });
  }
}
