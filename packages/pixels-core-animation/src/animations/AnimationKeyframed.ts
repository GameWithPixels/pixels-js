import { serializable } from "@systemic-games/pixels-core-utils";

import AnimationBits from "./AnimationBits";
import AnimationInstanceKeyframed from "./AnimationInstanceKeyframed";
import AnimationPreset from "./AnimationPreset";
import { AnimationTypeValues } from "./AnimationType";

/**
 * @category Animation
 */
export default class AnimationKeyframed implements AnimationPreset {
  @serializable(1)
  readonly type: number = AnimationTypeValues.keyframed;

  @serializable(1)
  animFlags = 0; // If 1 indices are led indices, not face indices

  @serializable(2)
  duration = 0; // In milliseconds

  @serializable(2)
  tracksOffset = 0; // Offset into a global buffer of tracks

  @serializable(2)
  trackCount = 0;

  createInstance(bits: AnimationBits): AnimationInstanceKeyframed {
    return new AnimationInstanceKeyframed(this, bits);
  }
}
