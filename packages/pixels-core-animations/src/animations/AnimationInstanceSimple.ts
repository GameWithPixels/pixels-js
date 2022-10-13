import AnimationInstance from "./AnimationInstance";
import AnimationSimple from "./AnimationSimple";
import * as Color32Utils from "../color/Color32Utils";
import Constants from "./Constants";

export default class AnimationInstanceSimple extends AnimationInstance {
  private _rgb = 0;

  get preset(): AnimationSimple {
    return this.animationPreset as AnimationSimple;
  }

  start(startTime: number, remapFace: number, loop: boolean): void {
    super.start(startTime, remapFace, loop);
    this._rgb = this.animationBits.getColor32(this.preset.colorIndex);
  }

  updateLeds(ms: number, retIndices: number[], retColors32: number[]): number {
    const preset = this.preset;

    // Compute color
    const black = 0;
    let color = 0;
    const period = preset.duration / preset.count;
    const fadeTime = (period * preset.fade) / (255 * 2);
    const onOffTime = (period - fadeTime * 2) / 2;
    const time = (ms - this.startTime) % period;

    if (time <= fadeTime) {
      // Ramp up
      color = Color32Utils.interpolateColors(
        black,
        0,
        this._rgb,
        fadeTime,
        time
      );
    } else if (time <= fadeTime + onOffTime) {
      color = this._rgb;
    } else if (time <= fadeTime * 2 + onOffTime) {
      // Ramp down
      color = Color32Utils.interpolateColors(
        this._rgb,
        fadeTime + onOffTime,
        black,
        fadeTime * 2 + onOffTime,
        time
      );
    } else {
      color = black;
    }

    // Fill the indices and colors for the anim controller to know how to update LEDs
    let retCount = 0;
    for (let i = 0; i < Constants.maxLedsCount; ++i) {
      if ((preset.faceMask & (1 << i)) !== 0) {
        retIndices[retCount] = i;
        retColors32[retCount] = color;
        retCount++;
      }
    }
    return retCount;
  }

  stop(retIndices: number[]): number {
    const preset = this.preset;
    let retCount = 0;
    for (let i = 0; i < Constants.maxLedsCount; ++i) {
      if ((preset.faceMask & (1 << i)) !== 0) {
        retIndices[retCount] = i;
        retCount++;
      }
    }
    return retCount;
  }
}
