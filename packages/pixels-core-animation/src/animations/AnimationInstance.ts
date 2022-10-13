import AnimationBits from "./AnimationBits";
import AnimationPreset from "./AnimationPreset";

export default abstract class AnimationInstance {
  private _animationPreset: AnimationPreset;
  private _animationBits: AnimationBits;
  private _startTime = 0;
  private _remapFace = 0;
  private _loop = false;

  get startTime(): number {
    return this._startTime;
  }

  get remapFace(): number {
    return this._remapFace;
  }

  get loop(): boolean {
    return this._loop;
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

  start(startTime: number, remapFace: number, loop: boolean): void {
    this._startTime = startTime;
    this._remapFace = remapFace;
    this._loop = loop;
  }

  // "virtual" method
  abstract updateLeds(
    ms: number,
    retIndices: number[],
    retColors32: number[]
  ): number;

  // "virtual" method
  abstract stop(retIndices: number[]): number;
}
