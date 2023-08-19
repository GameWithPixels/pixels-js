import {
  AnimationBits,
  AnimationPreset,
  AnimationRainbow,
  Constants,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditAnimation from "./EditAnimation";
import EditDataSet from "./EditDataSet";
import { widget, range, name, observable } from "./decorators";

export default class EditAnimationRainbow extends EditAnimation {
  readonly type = "rainbow";

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

  @widget("toggle")
  @name("Traveling Order")
  @observable
  traveling: boolean;

  @widget("slider")
  @range(0, 1)
  @name("Intensity")
  @observable
  intensity: number;

  @widget("faceMask")
  @name("Face Mask")
  @observable
  faces: number;

  constructor(opt?: {
    uuid?: string;
    name?: string;
    duration?: number;
    faces?: number;
    count?: number;
    fade?: number;
    traveling?: boolean;
    intensity?: number;
  }) {
    super(opt);
    this.faces = opt?.faces ?? Constants.faceMaskAll;
    this.count = opt?.count ?? 1;
    this.fade = opt?.fade ?? 0;
    this.traveling = opt?.traveling ?? false;
    this.intensity = opt?.intensity ?? 0.5;
  }

  toAnimation(_editSet: EditDataSet, _bits: AnimationBits): AnimationPreset {
    return safeAssign(new AnimationRainbow(), {
      duration: this.duration * 1000,
      faceMask: this.faces,
      fade: this.fade * 255,
      count: this.count,
      traveling: this.traveling ? 1 : 0,
      intensity: this.intensity * 255,
    });
  }

  duplicate(uuid?: string): EditAnimation {
    return new EditAnimationRainbow({ ...this, uuid });
  }
}
