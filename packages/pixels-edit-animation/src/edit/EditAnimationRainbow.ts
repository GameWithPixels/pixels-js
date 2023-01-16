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
  @range(0, 19, 1)
  @name("Face Mask")
  faces: number;

  @widget("count")
  @range(1, 10, 1)
  @name("Repeat Count")
  count: number;

  @widget("slider")
  @range(0, 1)
  @name("Fading Sharpness")
  fade: number;

  @widget("toggle")
  @name("Traveling Order")
  traveling: boolean;

  constructor(options?: {
    name?: string;
    duration?: number;
    faces?: number;
    count?: number;
    fade?: number;
    traveling?: boolean;
  }) {
    super(options?.name, options?.duration ?? 1);
    this.faces = options?.faces ?? Constants.faceMaskAllLEDs;
    this.count = options?.count ?? 1;
    this.fade = options?.fade ?? 0;
    this.traveling = options?.traveling ?? true;
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

  duplicate(): EditAnimation {
    return new EditAnimationRainbow({
      name: this.name,
      duration: this.duration,
      faces: this.faces,
      fade: this.fade,
      count: this.count,
      traveling: this.traveling,
    });
  }
}
