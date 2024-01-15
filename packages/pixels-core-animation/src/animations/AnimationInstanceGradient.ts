import AnimationGradient from "./AnimationGradient";
import AnimationInstance from "./AnimationInstance";

/**
 * @category Animation Instance
 */
export default class AnimationInstanceGradient extends AnimationInstance {
  get preset(): AnimationGradient {
    return this.preset as AnimationGradient;
  }

  updateLEDs(ms: number, retIndices: number[], retColors32: number[]): number {
    const preset = this.preset;
    const ledCount = this.die.ledCount;
    const time = ms - this.startTime;

    // Figure out the color from the gradient
    const gradient = this.bits.getRgbTrack(preset.gradientTrackOffset);
    const gradientTime = (time * 1000) / preset.duration;
    const color = gradient.evaluateColor(gradientTime, this.bits, this.die);

    // Fill the indices and colors for the anim controller to know how to update LEDs
    let retCount = 0;
    for (let i = 0; i < ledCount; ++i) {
      if ((preset.faceMask & (1 << i)) !== 0) {
        retIndices[retCount] = i;
        retColors32[retCount] = color;
        retCount++;
      }
    }
    return retCount;
  }

  stop(retIndices: number[]): number {
    return this.setIndices(this.preset.faceMask, retIndices);
  }
}
