import AnimationInstance from "./AnimationInstance";
import AnimationSequence from "./AnimationSequence";
import { Constants } from "./Constants";
import { Color32Utils } from "../color";

/**
 * @category Animation Instance
 */
export default class AnimationInstanceSequence extends AnimationInstance {
  private _lastMillis = -1;
  private _animInstances: {
    anim: AnimationInstance;
    delay: number;
    started: boolean;
  }[] = [];

  get preset(): AnimationSequence {
    return this.animationPreset as AnimationSequence;
  }

  start(startTime: number): void {
    super.start(startTime);
    this._lastMillis = -1;
    const preset = this.preset;
    const offsets = [
      preset.animation0Offset,
      preset.animation1Offset,
      preset.animation2Offset,
      preset.animation3Offset,
    ];
    const delays = [
      preset.animation0Delay,
      preset.animation1Delay,
      preset.animation2Delay,
      preset.animation3Delay,
    ];
    this._animInstances.length = 0;
    for (let i = 0; i < preset.animationCount; i++) {
      const offset = offsets[i];
      const delay = delays[i];
      this._animInstances.push({
        anim: this.bits
          .getAnimation(offset)
          .createInstance(this.bits, this.die),
        delay,
        started: false,
      });
    }
  }

  updateLEDs(ms: number, retIndices: number[], retColors32: number[]): number {
    const preset = this.preset;
    const lastMs = this._lastMillis - this.startTime;
    const thisMs = ms - this.startTime;
    this._lastMillis = ms;
    let retCount = 0;
    const animIndices: number[] = Array(Constants.maxLEDsCount);
    const animColors: number[] = Array(Constants.maxLEDsCount);
    for (let i = 0; i < preset.animationCount; i++) {
      const delay = this._animInstances[i].delay;
      if (
        !this._animInstances[i].started &&
        delay > lastMs &&
        delay <= thisMs
      ) {
        this._animInstances[i].anim.start(ms);
        this._animInstances[i].started = true;
      }
      if (this._animInstances[i].started) {
        animIndices.fill(0);
        animColors.fill(0);
        const count = this._animInstances[i].anim.updateLEDs(
          ms,
          animIndices,
          animColors
        );
        for (let j = 0; j < count; j++) {
          const k = retIndices.indexOf(animIndices[j]);
          if (k >= 0 && k < retCount) {
            retColors32[k] = Color32Utils.combineColors(
              retColors32[k],
              animColors[j]
            );
          } else {
            retIndices[retCount] = animIndices[j];
            retColors32[retCount] = animColors[j];
            ++retCount;
          }
        }
      }
    }
    return retCount;
  }

  stop(): number {
    return 0;
  }
}
