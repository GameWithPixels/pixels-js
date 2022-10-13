import {
  AnimationType,
  AnimationTypeValues,
  AnimationBits,
  AnimationPreset,
  AnimationKeyframed,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";
import EditAnimation from "./EditAnimation";
import EditDataSet from "./EditDataSet";
import EditPattern from "./EditPattern";
import { widget, range, units, name } from "./decorators";

export default class EditAnimationKeyframed extends EditAnimation {
  private _duration: number;

  get type(): AnimationType {
    return AnimationTypeValues.Keyframed;
  }

  @widget("slider")
  @range(0.1, 30, 0.1)
  @units("s")
  @name("Duration")
  get duration(): number {
    return this._duration;
  }
  set duration(value: number) {
    this._duration = value;
  }

  @widget("rgbPattern")
  @name("LED Pattern")
  pattern?: EditPattern;

  @name("Traveling Order")
  flowOrder: boolean;

  constructor(options?: {
    name?: string;
    duration?: number;
    pattern?: EditPattern;
    flowOrder?: boolean;
  }) {
    super(options?.name);
    this._duration = options?.duration ?? 1;
    this.pattern = options?.pattern;
    this.flowOrder = options?.flowOrder ?? false;
  }

  toAnimation(editSet: EditDataSet, _bits: AnimationBits): AnimationPreset {
    return safeAssign(new AnimationKeyframed(), {
      duration: this.duration * 1000, // stored in milliseconds
      tracksOffset: editSet.getPatternRGBTrackOffset(this.pattern),
      trackCount: this.pattern?.gradients.length ?? 0,
      flowOrder: this.flowOrder ? 1 : 0,
    });
  }

  duplicate(): EditAnimation {
    return new EditAnimationKeyframed({
      name: this.name,
      duration: this.duration,
      pattern: this.pattern,
      flowOrder: this.flowOrder,
    });
  }

  requiresPattern(pattern: EditPattern): { asRgb: boolean } | undefined {
    if (this.pattern === pattern) {
      return { asRgb: true };
    }
  }
}
