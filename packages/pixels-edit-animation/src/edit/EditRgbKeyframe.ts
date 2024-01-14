import {
  AnimationBits,
  Color,
  SimpleKeyframe,
  RgbKeyframe,
} from "@systemic-games/pixels-core-animation";

import EditColor from "./EditColor";
import EditDataSet from "./EditDataSet";
import { observable } from "./decorators";

export default class EditRgbKeyframe {
  @observable
  time: number;

  @observable
  color: Color;

  constructor(opt?: { time?: number; color?: Color }) {
    this.time = opt?.time ?? 0;
    this.color = opt?.color ?? Color.black.duplicate();
  }

  toRgbKeyframe(_editSet: EditDataSet, bits: AnimationBits): RgbKeyframe {
    const kf = new RgbKeyframe();
    // Add the color to the palette if not already there, otherwise grab the color index
    const colorIndex = EditColor.toColorIndex(bits.palette, this.color);
    kf.setTimeAndColorIndex(this.time, colorIndex);
    return kf;
  }

  toKeyframe(_editSet: EditDataSet, _bits: AnimationBits): SimpleKeyframe {
    const kf = new SimpleKeyframe();
    // Get the intensity from the color and scale
    kf.setTimeAndIntensity(this.time, this.color.desaturate() * 255);
    return kf;
  }

  duplicate(): EditRgbKeyframe {
    return new EditRgbKeyframe({
      ...this,
      color: this.color.duplicate(),
    });
  }
}
