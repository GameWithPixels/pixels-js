import AnimationCycle from "./AnimationCycle";
import AnimationInstance from "./AnimationInstance";
import { Color32Utils } from "../color";

/**
 * @category Animation Instance
 */
export default class AnimationInstanceCycle extends AnimationInstance {
  get preset(): AnimationCycle {
    return this.animationPreset as AnimationCycle;
  }

  updateLEDs(ms: number, retIndices: number[], retColors32: number[]): number {
    const preset = this.preset;
    const ledCount = this.die.ledCount;
    const time = ms - this.startTime;
    const fadeTime = (preset.duration * preset.fade) / (255 * 2);

    let intensity = preset.intensity;
    if (time <= fadeTime) {
      // Ramp up
      intensity = (time * preset.intensity) / fadeTime;
    } else if (time >= preset.duration - fadeTime) {
      // Ramp down
      intensity = ((preset.duration - time) * preset.intensity) / fadeTime;
    }

    // Figure out the color from the gradient
    const gradient = this.bits.getRgbTrack(preset.gradientTrackOffset);
    const gradientTime = (time * preset.count * 1000) / preset.duration;

    // Fill the indices and colors for the anim controller to know how to update leds
    let retCount = 0;
    for (let i = 0; i < ledCount; ++i) {
      if ((preset.faceMask & (1 << i)) !== 0) {
        retIndices[retCount] = i;
        const faceTime =
          (gradientTime + (i * 1000 * preset.cyclesTimes10) / (ledCount * 10)) %
          1000;
        retColors32[retCount] = Color32Utils.modulateColor(
          gradient.evaluateColor(faceTime, this.bits, this.die),
          intensity
        );
        retCount++;
      }
    }
    return retCount;
  }

  stop(retIndices: number[]): number {
    const ledCount = this.die.ledCount;
    const preset = this.preset;
    let retCount = 0;
    for (let i = 0; i < ledCount; ++i) {
      if ((preset.faceMask & (1 << i)) !== 0) {
        retIndices[retCount] = i;
        retCount++;
      }
    }
    return retCount;
  }
}
