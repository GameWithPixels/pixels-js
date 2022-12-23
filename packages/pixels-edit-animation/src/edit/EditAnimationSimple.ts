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
  @range(0, 19, 1)
  @name("Face Mask")
  faces: number;

  @widget("color")
  @name("Color")
  color: EditColor;

  @widget("count")
  @range(1, 10, 1)
  @name("Repeat Count")
  count: number;

  @widget("slider")
  @range(0.1, 1)
  @name("Fading Sharpness")
  fade: number;

  constructor(options?: {
    name?: string;
    duration?: number;
    faces?: number;
    color?: EditColor | Color;
    count?: number;
    fade?: number;
  }) {
    super(options?.name, options?.duration ?? 1);
    const color = options?.color ?? Color.red;
    this.faces = options?.faces ?? Constants.faceMaskAllLEDs;
    this.color = color instanceof Color ? EditColor.fromColor(color) : color;
    this.count = options?.count ?? 1;
    this.fade = options?.fade ?? 0.1;
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

  duplicate(): EditAnimation {
    return new EditAnimationSimple({
      name: this.name,
      duration: this.duration,
      faces: this.faces,
      color: this.color.duplicate(),
      count: this.count,
    });
  }
}
