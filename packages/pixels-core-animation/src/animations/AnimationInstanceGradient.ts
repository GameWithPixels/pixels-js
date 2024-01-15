import AnimationGradient from "./AnimationGradient";
import AnimationInstance from "./AnimationInstance";

/**
 * @category Animation Instance
 */
export default class AnimationInstanceGradient extends AnimationInstance {
  get preset(): AnimationGradient {
    return this.animationPreset as AnimationGradient;
  }

  updateLEDs(ms: number, retIndices: number[], retColors32: number[]): number {
    const preset = this.preset;
    const time = ms - this.startTime;

    // Figure out the color from the gradient
    const gradient = this.bits.getRgbTrack(preset.gradientTrackOffset);
    const gradientTime = (time * 1000) / preset.duration;
    const color = gradient.evaluateColor(gradientTime, this.bits, this.die);

    // Fill the indices and colors for the anim controller to know how to update LEDs
    return this.setColor(color, preset.faceMask, retIndices, retColors32);
  }

  stop(retIndices: number[]): number {
    return this.setIndices(this.preset.faceMask, retIndices);
  }
}
