import { serializable } from "@systemic-games/pixels-core-utils";

import AnimationBits from "./AnimationBits";
import AnimationInstanceSequence from "./AnimationInstanceSequence";
import AnimationPreset from "./AnimationPreset";
import { AnimationTypeValues } from "./AnimationType";
import VirtualDie from "../VirtualDie";

/**
 * @category Animation
 */
export default class AnimationSequence implements AnimationPreset {
  @serializable(1)
  readonly type: number = AnimationTypeValues.sequence;

  @serializable(1)
  animFlags = 0; // If 1 indices are led indices, not face indices

  @serializable(2)
  duration = 0; // In milliseconds

  // TODO: This is a hack to get around the fact that I don't know how to serialize arrays
  @serializable(2)
  animation0Offset = 0;
  @serializable(2)
  animation0Delay = 0;

  @serializable(2)
  animation1Offset = 0;
  @serializable(2)
  animation1Delay = 0;

  @serializable(2)
  animation2Offset = 0;
  @serializable(2)
  animation2Delay = 0;

  @serializable(2)
  animation3Offset = 0;
  @serializable(2)
  animation3Delay = 0;

  @serializable(2)
  animationCount = 0;

  createInstance(
    bits: AnimationBits,
    die: VirtualDie
  ): AnimationInstanceSequence {
    return new AnimationInstanceSequence(this, bits, die);
  }
}
