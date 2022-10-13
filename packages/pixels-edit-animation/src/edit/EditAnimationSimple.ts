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
import { widget, range, units, name } from "./decorators";

export default class EditAnimationSimple extends EditAnimation {
  private _duration: number;

  get type(): AnimationType {
    return AnimationTypeValues.Simple;
  }

  @widget("slider")
  @range(0.1, 30, 0)
  @units("s")
  @name("Duration")
  get duration(): number {
    return this._duration;
  }
  set duration(value: number) {
    this._duration = value;
  }

  @widget("faceMask")
  @range(0, 19, 1)
  @name("Face Mask")
  faces: number;

  @name("Color")
  color: EditColor;

  @widget("index")
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
    super(options?.name);
    const color = options?.color ?? Color.red;
    this._duration = options?.duration ?? 1;
    this.faces = options?.faces ?? Constants.faceMaskAllLeds;
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
