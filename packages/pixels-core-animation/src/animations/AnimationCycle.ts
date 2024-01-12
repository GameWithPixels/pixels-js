import { serializable } from "@systemic-games/pixels-core-utils";

import AnimationBits from "./AnimationBits";
import AnimationInstanceCycle from "./AnimationInstanceCycle";
import AnimationPreset from "./AnimationPreset";
import { AnimationTypeValues } from "./AnimationType";

/**
 * @category Animation
 */
export default class AnimationCycle implements AnimationPreset {
  @serializable(1)
  readonly type: number = AnimationTypeValues.cycle;

  @serializable(1)
  animFlags = 0;

  @serializable(2)
  duration = 0; // In milliseconds

  @serializable(4)
  faceMask = 0;

  @serializable(1)
  count = 0;

  @serializable(1)
  fade = 0;

  @serializable(1)
  intensity = 128;

  @serializable(1)
  cyclesTimes10 = 10;

  @serializable(2)
  gradientTrackOffset = 0;

  createInstance(bits: AnimationBits): AnimationInstanceCycle {
    return new AnimationInstanceCycle(this, bits);
  }
}
