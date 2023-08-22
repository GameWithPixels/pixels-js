import { serializable } from "@systemic-games/pixels-core-utils";

import AnimationBits from "./AnimationBits";
import AnimationInstanceGradient from "./AnimationInstanceGradient";
import AnimationPreset from "./AnimationPreset";
import { AnimationTypeValues } from "./AnimationType";

/**
 * @category Animation
 */
export default class AnimationGradient implements AnimationPreset {
  @serializable(1)
  readonly type: number = AnimationTypeValues.gradient;

  @serializable(1)
  animFlags = 0; // If 1 indices are led indices, not face indices

  @serializable(2)
  duration = 0; // In milliseconds

  @serializable(4)
  faceMask = 0;

  @serializable(2, { padding: 2 })
  gradientTrackOffset = 0;

  createInstance(bits: AnimationBits): AnimationInstanceGradient {
    return new AnimationInstanceGradient(this, bits);
  }
}
