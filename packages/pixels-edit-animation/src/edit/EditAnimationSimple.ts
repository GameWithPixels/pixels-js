import {
  AnimationType,
  AnimationTypeValues,
  AnimationBits,
  AnimationPreset,
  AnimationSimple,
  Constants,
  Color,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditAnimation from "./EditAnimation";
import EditColor from "./EditColor";
import EditDataSet from "./EditDataSet";
import { widget, range, name } from "./decorators";

export default class EditAnimationSimple extends EditAnimation {
  get type(): AnimationType {
    return AnimationTypeValues.simple;
  }

  @widget("faceMask")
  @range(1, 20, 1)
  @name("Face Mask")
  faces: number;

  @widget("color")
  @name("Color")
  color: EditColor;

  @widget("count")
  @range(1, 10)
  @name("Repeat Count")
  count: number;

  @widget("slider")
  @range(0, 1)
  @name("Fading Sharpness")
  fade: number;

  constructor(opt?: {
    uuid?: string;
    name?: string;
    duration?: number;
    faces?: number;
    color?: EditColor | Color;
    count?: number;
    fade?: number;
  }) {
    super(opt);
    const color = opt?.color ?? Color.blue;
    this.faces = opt?.faces ?? Constants.faceMaskAllLEDs;
    this.color = color instanceof Color ? new EditColor(color) : color;
    this.count = opt?.count ?? 1;
    this.fade = opt?.fade ?? 0;
  }

  toAnimation(editSet: EditDataSet, bits: AnimationBits): AnimationPreset {
    return safeAssign(new AnimationSimple(), {
      duration: this.duration * 1000,
      faceMask: this.faces,
      colorIndex: this.color.toColorIndex(bits.palette),
      fade: 255 * this.fade,
      count: this.count,
    });
  }

  duplicate(uuid?: string): EditAnimation {
    return new EditAnimationSimple({ ...this, uuid });
  }
}
