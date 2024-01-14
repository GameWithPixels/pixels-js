import { AnimationBits, RgbTrack } from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditDataSet from "./EditDataSet";
import EditRgbGradient from "./EditRgbGradient";
import { observable } from "./decorators";

export default class EditRgbTrack {
  @observable
  ledIndices: number[];

  @observable
  gradient: EditRgbGradient;

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

  constructor(opt?: { gradient?: EditRgbGradient; ledIndices?: number[] }) {
    this.gradient = opt?.gradient ?? new EditRgbGradient();
    this.ledIndices = opt?.ledIndices ?? [];
  }

  toTrack(editSet: EditDataSet, bits: AnimationBits): RgbTrack {
    // Add the keyframes
    const keyframesOffset = bits.rgbKeyframes.length;
    for (const editKeyframe of this.gradient.keyframes) {
      bits.rgbKeyframes.push(editKeyframe.toRgbKeyframe(editSet, bits));
    }
    return safeAssign(new RgbTrack(), {
      keyframesOffset,
      keyFrameCount: this.gradient.keyframes.length,
      ledMask: this.ledIndices.reduce((acc, index) => acc | (1 << index), 0),
    });
  }
}
