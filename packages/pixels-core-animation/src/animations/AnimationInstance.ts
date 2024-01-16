import AnimationBits from "./AnimationBits";
import AnimationPreset from "./AnimationPreset";
import VirtualDie from "../VirtualDie";

/**
 * @category Animation Instance
 */
export default abstract class AnimationInstance {
  private _animationPreset: AnimationPreset;
  private _animationBits: AnimationBits;
  private _virtualDie: VirtualDie;
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

  protected get bits(): AnimationBits {
    return this._animationBits;
  }

  protected get die(): VirtualDie {
    return this._virtualDie;
  }

  // TODO add readonly to constructor parameters
  constructor(preset: AnimationPreset, bits: AnimationBits, die: VirtualDie) {
    this._animationPreset = preset;
    this._animationBits = bits;
    this._virtualDie = die;
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

  protected setIndices(faceMask: number, retIndices: number[]): number {
    const ledCount = this._virtualDie.ledCount;
    let retCount = 0;
    for (let i = 0; i < ledCount; ++i) {
      if ((faceMask & (1 << i)) !== 0) {
        retIndices[retCount] = i;
        retCount++;
      }
    }
    return retCount;
  }

  setColor(
    color: number,
    faceMask: number,
    retIndices: number[],
    retColors: number[]
  ): number {
    const ledCount = this._virtualDie.ledCount;
    let retCount = 0;
    for (let i = 0; i < ledCount; ++i) {
      if ((faceMask & (1 << i)) !== 0) {
        retIndices[retCount] = i;
        retColors[retCount] = color;
        retCount++;
      }
    }
    return retCount;
  }
}
