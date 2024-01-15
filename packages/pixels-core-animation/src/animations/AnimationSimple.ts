import { serializable } from "@systemic-games/pixels-core-utils";

import AnimationBits from "./AnimationBits";
import AnimationInstanceSimple from "./AnimationInstanceSimple";
import AnimationPreset from "./AnimationPreset";
import { AnimationTypeValues } from "./AnimationType";
import VirtualDie from "../VirtualDie";

/**
 * @category Animation
 */
export default class AnimationSimple implements AnimationPreset {
  @serializable(1)
  readonly type: number = AnimationTypeValues.simple;

  @serializable(1)
  animFlags = 0; // If 1 indices are led indices, not face indices

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

  createInstance(
    bits: AnimationBits,
    die: VirtualDie
  ): AnimationInstanceSimple {
    return new AnimationInstanceSimple(this, bits, die);
  }
}
