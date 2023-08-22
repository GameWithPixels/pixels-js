import {
  AnimationType,
  AnimationBits,
  AnimationPreset,
  AnimationFlagsValues,
} from "@systemic-games/pixels-core-animation";

import EditDataSet from "./EditDataSet";
import EditPattern from "./EditPattern";
import Editable from "./Editable";
import { widget, range, unit, name, observable, values } from "./decorators";

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

  constructor(opt?: {
    uuid?: string;
    name?: string;
    animFlags?: number;
    duration?: number;
  }) {
    super(opt);
    this.animFlags = opt?.animFlags ?? AnimationFlagsValues.none;
    this.duration = opt?.duration ?? 1;
  }

  abstract toAnimation(
    editSet: EditDataSet,
    bits: AnimationBits
  ): AnimationPreset;

  abstract duplicate(uuid?: string): EditAnimation;

  collectPatterns(): { rgb?: EditPattern[]; grayscale?: EditPattern[] } {
    return {};
  }
}
