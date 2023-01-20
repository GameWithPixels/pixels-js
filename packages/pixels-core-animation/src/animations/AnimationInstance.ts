import AnimationBits from "./AnimationBits";
import AnimationPreset from "./AnimationPreset";

/**
 * @category Animation Instance
 */
export default abstract class AnimationInstance {
  private _animationPreset: AnimationPreset;
  private _animationBits: AnimationBits;
  private _startTime = 0;

  get startTime(): number {
    return this._startTime;
  }

  get duration(): number {
    return this._animationPreset.duration;
  }

  protected get animationPreset(): AnimationPreset {
    return this._animationPreset;
  }

  protected get animationBits(): AnimationBits {
    return this._animationBits;
  }

  constructor(animation: AnimationPreset, bits: AnimationBits) {
    this._animationPreset = animation;
    this._animationBits = bits;
  }

  start(startTime: number): void {
    this._startTime = startTime;
  }

  abstract updateLEDs(
    ms: number,
    retIndices: number[],
    retColors32: number[]
  ): number;

  abstract stop(retIndices: number[]): number;
}
