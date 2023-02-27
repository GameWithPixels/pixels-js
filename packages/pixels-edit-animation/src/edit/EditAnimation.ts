import {
  AnimationType,
  AnimationBits,
  AnimationPreset,
} from "@systemic-games/pixels-core-animation";

import EditDataSet from "./EditDataSet";
import EditPattern from "./EditPattern";
import Editable from "./Editable";
import { widget, range, unit, name } from "./decorators";

/**
 * Base class for animation editing classes.
 */
export default abstract class EditAnimation extends Editable {
  /** The animation type (constant). */
  abstract get type(): AnimationType;

  @widget("slider")
  @range(0.1, 30, 0.1)
  @unit("s")
  @name("Duration")
  /** Animation duration in seconds. */
  duration: number;

  constructor(opt?: { uuid?: string; name?: string; duration?: number }) {
    super(opt);
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
