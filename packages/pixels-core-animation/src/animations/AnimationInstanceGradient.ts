import AnimationGradient from "./AnimationGradient";
import AnimationInstance from "./AnimationInstance";
import { Constants } from "./Constants";

/**
 * @category Animation Instance
 */
export default class AnimationInstanceGradient extends AnimationInstance {
  get preset(): AnimationGradient {
    return this.animationPreset as AnimationGradient;
  }

  updateLEDs(ms: number, retIndices: number[], retColors32: number[]): number {
    const time = ms - this.startTime;
    const preset = this.preset;

    // Figure out the color from the gradient
    const gradient = this.animationBits.getRgbTrack(preset.gradientTrackOffset);
    const gradientTime = (time * 1000) / preset.duration;
    const color = gradient.evaluateColor(this.animationBits, gradientTime);

    // Fill the indices and colors for the anim controller to know how to update LEDs
    let retCount = 0;
    for (let i = 0; i < Constants.maxLEDsCount; ++i) {
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
    for (let i = 0; i < Constants.maxLEDsCount; ++i) {
      if ((preset.faceMask & (1 << i)) !== 0) {
        retIndices[retCount] = i;
        retCount++;
      }
    }
    return retCount;
  }
}
