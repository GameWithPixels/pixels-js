import {
  AnimationType,
  AnimationTypeValues,
  AnimationBits,
  AnimationPreset,
  AnimationRainbow,
  Constants,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditAnimation from "./EditAnimation";
import EditDataSet from "./EditDataSet";
import { widget, range, name } from "./decorators";

export default class EditAnimationRainbow extends EditAnimation {
  get type(): AnimationType {
    return AnimationTypeValues.rainbow;
  }

  @widget("faceMask")
  @range(1, 20, 1)
  @name("Face Mask")
  faces: number;

  @widget("count")
  @range(1, 10)
  @name("Repeat Count")
  count: number;

  @widget("slider")
  @range(0, 1)
  @name("Fading Sharpness")
  fade: number;

  @widget("toggle")
  @name("Traveling Order")
  traveling: boolean;

  constructor(opt?: {
    uuid?: string;
    name?: string;
    duration?: number;
    faces?: number;
    count?: number;
    fade?: number;
    traveling?: boolean;
  }) {
    super(opt);
    this.faces = opt?.faces ?? Constants.faceMaskAllLEDs;
    this.count = opt?.count ?? 1;
    this.fade = opt?.fade ?? 0;
    this.traveling = opt?.traveling ?? true;
  }

  toAnimation(_editSet: EditDataSet, _bits: AnimationBits): AnimationPreset {
    return safeAssign(new AnimationRainbow(), {
      duration: this.duration * 1000,
      faceMask: this.faces,
      fade: this.fade * 255,
      count: this.count,
      traveling: this.traveling,
    });
  }

  duplicate(uuid?: string): EditAnimation {
    return new EditAnimationRainbow({ ...this, uuid });
  }
}
