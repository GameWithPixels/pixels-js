import { Color } from "@systemic-games/pixels-core-animation";
import EditRgbKeyframe from "./EditRgbKeyframe";
import Editable from "./Editable";

export default class EditRgbGradient extends Editable {
  readonly keyframes: EditRgbKeyframe[];

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

  constructor(keyframes: EditRgbKeyframe[] = []) {
    super();
    this.keyframes = keyframes;
  }

  duplicate(): EditRgbGradient {
    const track = new EditRgbGradient();
    if (this.keyframes != null) {
      this.keyframes.forEach((keyframe) => {
        track.keyframes.push(keyframe.duplicate());
      });
    }
    return track;
  }

  static createFromKeyFrames(
    keyframes: {
      time: number;
      color: Color;
    }[]
  ): EditRgbGradient {
    const rgbKeyframes = keyframes
      .sort((kf1, kf2) => kf1.time - kf2.time)
      .map((kf) => new EditRgbKeyframe(kf.time, kf.color));
    if (!rgbKeyframes.length || rgbKeyframes[0].time > 0) {
      rgbKeyframes.splice(0, 0, new EditRgbKeyframe(0));
    }
    if (!rgbKeyframes.length || keyframes[keyframes.length - 1].time < 1) {
      rgbKeyframes.push(new EditRgbKeyframe(1));
    }
    return new EditRgbGradient(rgbKeyframes);
  }
}
