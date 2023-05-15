import { serializable } from "@systemic-games/pixels-core-utils";

import AnimationBits from "./AnimationBits";
import AnimationInstanceRainbow from "./AnimationInstanceRainbow";
import AnimationPreset from "./AnimationPreset";
import { AnimationTypeValues } from "./AnimationType";

/**
 * @category Animation
 */
export default class AnimationRainbow implements AnimationPreset {
  @serializable(1, { padding: 1 })
  readonly type: number = AnimationTypeValues.rainbow;

  @serializable(2)
  duration = 0; // In milliseconds

  @serializable(4)
  faceMask = 0;

  @serializable(1)
  count = 0;

  @serializable(1)
  fade = 0;

  @serializable(1)
  traveling = false;

  @serializable(1)
  intensity = 128;

  createInstance(bits: AnimationBits): AnimationInstanceRainbow {
    return new AnimationInstanceRainbow(this, bits);
  }
}
