import { Color } from "@systemic-games/pixels-core-animation";

import EditRgbKeyframe from "./EditRgbKeyframe";
import Editable from "./Editable";
import { observable } from "./decorators";

export default class EditRgbGradient extends Editable {
  @observable
  keyframes: EditRgbKeyframe[];

  get empty(): boolean {
    return !this.keyframes.length;
  }

  get duration(): number {
    return this.keyframes.length
      ? Math.max(...this.keyframes.map((k) => k.time))
      : 0;
  }

  get firstTime(): number {
    return this.keyframes.length ? this.keyframes[0].time : 0;
  }

  get lastTime(): number {
    return this.keyframes.length
      ? this.keyframes[this.keyframes.length - 1].time
      : 0;
  }

  constructor(opt?: { uuid?: string; keyframes?: EditRgbKeyframe[] }) {
    super(opt);
    this.keyframes = opt?.keyframes ?? [];
  }

  duplicate(uuid?: string): EditRgbGradient {
    return new EditRgbGradient({
      uuid,
      keyframes: this.keyframes.map((kf) => kf.duplicate()),
    });
  }

  static createFromKeyFrames(
    keyframes: {
      time: number;
      color: Color;
    }[]
  ): EditRgbGradient {
    const rgbKeyframes = keyframes
      .sort((kf1, kf2) => kf1.time - kf2.time)
      .map((kf) => new EditRgbKeyframe(kf));
    if (!rgbKeyframes.length || rgbKeyframes[0].time > 0) {
      rgbKeyframes.unshift(new EditRgbKeyframe({ time: 0 }));
    }
    if (!rgbKeyframes.length || keyframes[keyframes.length - 1].time < 1) {
      rgbKeyframes.push(new EditRgbKeyframe({ time: 1 }));
    }
    return new EditRgbGradient({ keyframes: rgbKeyframes });
  }
}
