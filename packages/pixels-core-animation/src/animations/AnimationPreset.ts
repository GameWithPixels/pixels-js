import AnimationBits from "./AnimationBits";
import AnimationInstance from "./AnimationInstance";

/**
 * @category Animation
 */
export default interface AnimationPreset {
  /** See {@link AnimationTypeValues} for possible values. */
  readonly type: number;
  traveling: number;
  duration: number; // In milliseconds

  createInstance(bits: AnimationBits): AnimationInstance;
}
