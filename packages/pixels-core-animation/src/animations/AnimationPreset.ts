import AnimationBits from "./AnimationBits";
import AnimationInstance from "./AnimationInstance";

/**
 * Common interface for all animation types.
 * @category Animation
 */
export default interface AnimationPreset {
  /** See {@link AnimationTypeValues} for possible values. */
  readonly type: number;
  /** See {@link AnimationFlagsValues} for possible values. */
  animFlags: number;
  /** Animation duration in milliseconds. */
  duration: number;

  createInstance(bits: AnimationBits): AnimationInstance;
}
