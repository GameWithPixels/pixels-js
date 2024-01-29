import { serializable } from "@systemic-games/pixels-core-utils";

import AnimationBits from "./AnimationBits";
import AnimationInstanceNoise from "./AnimationInstanceNoise";
import AnimationPreset from "./AnimationPreset";
import { AnimationTypeValues } from "./AnimationType";
import { NoiseColorOverrideTypeValues } from "./NoiseColorOverrideType";

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
  blinkFrequencyTimes1000 = 0; // per seconds, i.e. 1000 == 1 Hz

  @serializable(2)
  blinkFrequencyVarTimes1000 = 0;

  @serializable(2)
  blinkDuration = 0;

  @serializable(1)
  fade = 0; // 0 - 255

  @serializable(1)
  overallGradientColorType: number = NoiseColorOverrideTypeValues.none;

  @serializable(2)
  overallGradientColorVar = 0; // 0 - 1000

  createInstance(bits: AnimationBits): AnimationInstanceNoise {
    return new AnimationInstanceNoise(this, bits);
  }
}
