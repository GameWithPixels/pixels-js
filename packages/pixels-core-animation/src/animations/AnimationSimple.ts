import { serializable } from "@systemic-games/pixels-core-utils";

import AnimationBits from "./AnimationBits";
import AnimationInstanceSimple from "./AnimationInstanceSimple";
import AnimationPreset from "./AnimationPreset";
import { AnimationType, AnimationTypeValues } from "./AnimationType";

/**
 * @category Animation
 */
export default class AnimationSimple implements AnimationPreset {
  @serializable(1, { padding: 1 })
  readonly type: AnimationType = AnimationTypeValues.Simple;

  @serializable(2)
  duration = 0; // In milliseconds

  @serializable(4)
  faceMask = 0;

  @serializable(2)
  colorIndex = 0;

  @serializable(1)
  count = 0;

  @serializable(1)
  fade = 0;

  createInstance(bits: AnimationBits): AnimationInstanceSimple {
    return new AnimationInstanceSimple(this, bits);
  }
}
