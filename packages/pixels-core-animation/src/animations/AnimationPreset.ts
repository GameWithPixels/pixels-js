import AnimationBits from "./AnimationBits";
import AnimationInstance from "./AnimationInstance";
import { AnimationType } from "./AnimationType";

/**
 * @category Animation
 */
export default interface AnimationPreset {
  readonly type: AnimationType;
  duration: number; // In milliseconds

  createInstance(bits: AnimationBits): AnimationInstance;
}
