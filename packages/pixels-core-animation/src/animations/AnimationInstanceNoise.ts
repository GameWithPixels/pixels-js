import AnimationGradient from "./AnimationGradient";
import AnimationInstance from "./AnimationInstance";

/**
 * @category Animation Instance
 */
export default class AnimationInstanceNoise extends AnimationInstance {
  get preset(): AnimationGradient {
    return this.animationPreset as AnimationGradient;
  }

  updateLEDs(
    _ms: number,
    _retIndices: number[],
    _retColors32: number[]
  ): number {
    //TODO not implemented
    return 0;
  }

  stop(_retIndices: number[]): number {
    //TODO not implemented
    return 0;
  }
}
