import {
  AnimationType,
  AnimationBits,
  AnimationPreset,
  AnimationFlagsValues,
  PixelDieTypeValues,
  AnimationCategoryValues,
  AnimationCategory,
  PixelDieType,
} from "@systemic-games/pixels-core-animation";

import EditDataSet from "./EditDataSet";
import EditPattern from "./EditPattern";
import EditRgbGradient from "./EditRgbGradient";
import Editable from "./Editable";
import { widget, range, unit, name, observable, values } from "./decorators";

export interface EditAnimationParams {
  uuid?: string;
  name?: string;
  animFlags?: number;
  duration?: number;
  category?: AnimationCategory;
  dieType?: PixelDieType;
}

/**
 * Base class for animation editing classes.
 */
export default abstract class EditAnimation extends Editable {
  /** The animation type. */
  abstract readonly type: AnimationType;

  @widget("slider")
  @range(0.1, 30, 0.1)
  @unit("s")
  @name("Duration")
  @observable
  /** Animation duration in seconds. */
  duration: number;

  @widget("bitField")
  @name("Animation Flags")
  @values(AnimationFlagsValues)
  @observable
  animFlags: number;

  @values(AnimationCategoryValues)
  @observable
  category: AnimationCategory;

  @values(PixelDieTypeValues)
  @observable
  dieType: PixelDieType;

  constructor(opt?: EditAnimationParams) {
    super(opt);
    this.animFlags = opt?.animFlags ?? AnimationFlagsValues.none;
    this.duration = opt?.duration ?? 1;
    this.category = opt?.category ?? "system";
    this.dieType = opt?.dieType ?? "unknown";
  }

  abstract toAnimation(
    editSet: EditDataSet,
    bits: AnimationBits
  ): AnimationPreset;

  abstract duplicate(uuid?: string): EditAnimation;

  collectPatterns(): { rgb?: EditPattern[]; grayscale?: EditPattern[] } {
    return {};
  }

  collectGradients(): EditRgbGradient[] {
    return [];
  }
}
