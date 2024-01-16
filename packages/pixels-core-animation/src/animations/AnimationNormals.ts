import { serializable } from "@systemic-games/pixels-core-utils";

import AnimationBits from "./AnimationBits";
import AnimationInstanceNormals from "./AnimationInstanceNormals";
import AnimationPreset from "./AnimationPreset";
import { AnimationTypeValues } from "./AnimationType";
import { NormalsColorOverrideTypeValues } from "./NormalsColorOverrideType";
import VirtualDie from "../VirtualDie";

/**
 * @category Animation
 */
export default class AnimationNormals implements AnimationPreset {
  @serializable(1)
  readonly type: number = AnimationTypeValues.normals;

  @serializable(1)
  animFlags = 0;

  @serializable(2)
  duration = 0; // In milliseconds

  @serializable(2)
  gradientTrackOffset = 0; // 0 - 1, over duration of the animation

  @serializable(2)
  axisGradientTrackOffset = 0; // 0 = top, 1 = bottom

  @serializable(2)
  angleGradientTrackOffset = 0; // 0 = -pi, 1 = pi

  @serializable(2, { numberFormat: "signed" })
  axisScaleTimes1000 = 0;

  @serializable(2, { numberFormat: "signed" })
  axisOffsetTimes1000 = 0;

  @serializable(2, { numberFormat: "signed" })
  axisScrollSpeedTimes1000 = 0; // in cycles, can be negative

  @serializable(2, { numberFormat: "signed" })
  angleScrollSpeedTimes1000 = 0; // in cycles, can be negative

  @serializable(1)
  fade = 0; // 0 - 255

  @serializable(1)
  mainGradientColorType: number = NormalsColorOverrideTypeValues.none;

  @serializable(2)
  mainGradientColorVar = 0; // 0 - 1000

  createInstance(
    bits: AnimationBits,
    die: VirtualDie
  ): AnimationInstanceNormals {
    return new AnimationInstanceNormals(this, bits, die);
  }
}
