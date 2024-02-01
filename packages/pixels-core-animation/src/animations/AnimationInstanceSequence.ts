import AnimationInstance from "./AnimationInstance";
import AnimationSequence from "./AnimationSequence";

/**
 * @category Animation Instance
 */
export default class AnimationInstanceSequence extends AnimationInstance {
  get preset(): AnimationSequence {
    return this.animationPreset as AnimationSequence;
  }

  start(startTime: number): void {
    super.start(startTime);
    // TODO
  }

  updateLEDs(_0: number, _1: number[], _2: number[]): number {
    // TODO
    return 0;
  }

  stop(_0: number[]): number {
    // TODO
    return 0;
  }
}
