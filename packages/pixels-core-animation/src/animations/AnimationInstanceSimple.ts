import AnimationInstance from "./AnimationInstance";
import AnimationSimple from "./AnimationSimple";
import { Color32Utils } from "../color";

/**
 * @category Animation Instance
 */
export default class AnimationInstanceSimple extends AnimationInstance {
  private _rgb = 0;

  get preset(): AnimationSimple {
    return this.animationPreset as AnimationSimple;
  }

  start(startTime: number): void {
    super.start(startTime);
    this._rgb = this.bits.getColor32(this.preset.colorIndex, this.die);
  }

  updateLEDs(ms: number, retIndices: number[], retColors32: number[]): number {
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
    return this.setColor(color, preset.faceMask, retIndices, retColors32);
  }

  stop(retIndices: number[]): number {
    return this.setIndices(this.preset.faceMask, retIndices);
  }
}
