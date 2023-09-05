import { serializable } from "@systemic-games/pixels-core-utils";

import AnimationBits from "./AnimationBits";
import AnimationInstanceGradient from "./AnimationInstanceGradient";
import AnimationPreset from "./AnimationPreset";
import { AnimationTypeValues } from "./AnimationType";

/**
 * @category Animation
 */
export default class AnimationNoise implements AnimationPreset {
  @serializable(1)
  readonly type: number = AnimationTypeValues.noise;

  @serializable(1)
  animFlags = 0;

  @serializable(2)
  duration = 0; // In milliseconds

  @serializable(2)
  gradientTrackOffset = 0; // Offset into a global buffer of tracks

  @serializable(2)
  blinkTrackOffset = 0; // Offset into a global buffer of tracks

  @serializable(2)
  blinkCount = 0;

  @serializable(1)
  blinkDuration = 0;

  @serializable(1)
  fade = 0;

  @serializable(4)
  faceMask = 0;

  createInstance(bits: AnimationBits): AnimationInstanceGradient {
    return new AnimationInstanceGradient(this, bits);
  }
}
