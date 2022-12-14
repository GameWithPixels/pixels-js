import {
  AnimationType,
  AnimationBits,
  AnimationPreset,
} from "@systemic-games/pixels-core-animation";

import EditDataSet from "./EditDataSet";
import EditPattern from "./EditPattern";
import Editable from "./Editable";
import { widget, range, units, name } from "./decorators";

/**
 * Base class for animation editing classes.
 */
export default abstract class EditAnimation extends Editable {
  /** The animation name. */
  name: string;

  /** The animation type (constant). */
  abstract get type(): AnimationType;

  @widget("slider")
  @range(0.1, 30, 0.1)
  @units("s")
  @name("Duration")
  /** Animation duration in seconds. */
  duration: number;

  constructor(name = "", duration = 0) {
    super();
    this.name = name;
    this.duration = duration;
  }

  abstract toAnimation(
    editSet: EditDataSet,
    bits: AnimationBits
  ): AnimationPreset;
  abstract duplicate(): EditAnimation;

  requiresPattern(_pattern: EditPattern): { asRgb: boolean } | undefined {
    return undefined;
  }
}
