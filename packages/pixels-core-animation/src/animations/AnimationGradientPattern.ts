import { serializable } from "@systemic-games/pixels-core-utils";

import AnimationBits from "./AnimationBits";
import AnimationInstanceGradientPattern from "./AnimationInstanceGradientPattern";
import AnimationPreset from "./AnimationPreset";
import { AnimationType, AnimationTypeValues } from "./AnimationType";

/**
 * @category Animation
 */
export default class AnimationGradientPattern implements AnimationPreset {
  @serializable(1, { padding: 1 })
  readonly type: AnimationType = AnimationTypeValues.gradientPattern;

  @serializable(2)
  duration = 0; // In milliseconds

  @serializable(2)
  tracksOffset = 0; // Offset into a global buffer of tracks

  @serializable(2)
  trackCount = 0;

  @serializable(2)
  gradientTrackOffset = 0;

  @serializable(1, { padding: 1 })
  overrideWithFace = 0;

  createInstance(bits: AnimationBits): AnimationInstanceGradientPattern {
    return new AnimationInstanceGradientPattern(this, bits);
  }
}
