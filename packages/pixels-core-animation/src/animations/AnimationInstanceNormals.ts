import AnimationInstance from "./AnimationInstance";
import AnimationNormals from "./AnimationNormals";
import { Constants } from "./Constants";

/**
 * @category Animation Instance
 */
export default class AnimationInstanceNormals extends AnimationInstance {
  get preset(): AnimationNormals {
    return this.animationPreset as AnimationNormals;
  }

  updateLEDs(ms: number, retIndices: number[], retColors32: number[]): number {
    const time = ms - this.startTime;
    const preset = this.preset;

    // Figure out the color from the gradient
    const gradient = this.animationBits.getRgbTrack(preset.gradient);
    const gradientTime = (time * 1000) / preset.duration;
    const color = gradient.evaluateColor(this.animationBits, gradientTime);

    // Fill the indices and colors for the anim controller to know how to update LEDs
    let retCount = 0;
    for (let i = 0; i < Constants.maxLEDsCount; ++i) {
      retIndices[retCount] = i;
      retColors32[retCount] = color;
      retCount++;
    }
    return retCount;
  }

  stop(retIndices: number[]): number {
    let retCount = 0;
    for (let i = 0; i < Constants.maxLEDsCount; ++i) {
      retIndices[retCount] = i;
      retCount++;
    }
    return retCount;
  }
}
