import {
  AnimationBits,
  AnimationPreset,
  AnimationSimple,
  Constants,
  Color,
  AnimationCategory,
  PixelDieType,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditAnimation from "./EditAnimation";
import EditColor from "./EditColor";
import EditDataSet from "./EditDataSet";
import { widget, range, name, observable } from "./decorators";

export default class EditAnimationSimple extends EditAnimation {
  readonly type = "simple";

  @widget("color")
  @name("Color")
  @observable
  color: EditColor;

  @widget("count")
  @range(1, 10)
  @name("Repeat Count")
  @observable
  count: number;

  @widget("slider")
  @range(0, 1)
  @name("Fading Sharpness")
  @observable
  fade: number;

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
    color?: EditColor | Color;
    count?: number;
    fade?: number;
  }) {
    super(opt);
    const color = opt?.color ?? Color.blue;
    this.faces = opt?.faces ?? Constants.faceMaskAll;
    this.color = color instanceof EditColor ? color : new EditColor(color);
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
