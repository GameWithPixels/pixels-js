import { serializable } from "@systemic-games/pixels-core-utils";

import AnimationBits from "./AnimationBits";
import AnimationInstanceKeyframed from "./AnimationInstanceKeyframed";
import AnimationPreset from "./AnimationPreset";
import { AnimationType, AnimationTypeValues } from "./AnimationType";

/**
 * @category Animation
 */
export default class AnimationKeyframed implements AnimationPreset {
  @serializable(1, { padding: 1 })
  readonly type: AnimationType = AnimationTypeValues.keyframed;

  @serializable(2)
  duration = 0; // In milliseconds

  @serializable(2)
  tracksOffset = 0; // Offset into a global buffer of tracks

  @serializable(2)
  trackCount = 0;

  @serializable(1, { padding: 1 })
  flowOrder = 0; // boolean, if true the indices are led indices, not face indices

  createInstance(bits: AnimationBits): AnimationInstanceKeyframed {
    return new AnimationInstanceKeyframed(this, bits);
  }
}
