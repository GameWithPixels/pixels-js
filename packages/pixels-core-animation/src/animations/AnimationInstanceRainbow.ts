import { AnimationFlagsValues } from "./AnimationFlags";
import AnimationInstance from "./AnimationInstance";
import AnimationRainbow from "./AnimationRainbow";
import { Color32Utils } from "../color";

/**
 * @category Animation Instance
 */
export default class AnimationInstanceRainbow extends AnimationInstance {
  get preset(): AnimationRainbow {
    return this.animationPreset as AnimationRainbow;
  }

  updateLEDs(ms: number, retIndices: number[], retColors32: number[]): number {
    const preset = this.preset;
    const ledCount = this.die.ledCount;

    // Compute color
    let color = 0;
    const fadeTime = (preset.duration * preset.fade) / (255 * 2);
    const time = ms - this.startTime;

    const wheelPos = ((time * preset.count * 255) / preset.duration) % 256;

    let intensity = preset.intensity;
    if (time <= fadeTime) {
      // Ramp up
      intensity = (time * preset.intensity) / fadeTime;
    } else if (time >= preset.duration - fadeTime) {
      // Ramp down
      intensity = ((preset.duration - time) * preset.intensity) / fadeTime;
    }

    // Fill the indices and colors for the anim controller to know how to update LEDs
    let retCount = 0;
    if (preset.animFlags & AnimationFlagsValues.traveling) {
      for (let i = 0; i < ledCount; ++i) {
        if ((preset.faceMask & (1 << i)) !== 0) {
          retIndices[retCount] = i;
          retColors32[retCount] = Color32Utils.rainbowWheel(
            (wheelPos + (i * 256 * preset.cyclesTimes10) / (ledCount * 10)) %
              256,
            intensity
          );
          retCount++;
        }
      }
    } else {
      // All LEDs same color
      color = Color32Utils.rainbowWheel(wheelPos, intensity);
      retCount = this.setColor(color, preset.faceMask, retIndices, retColors32);
    }
    return retCount;
  }

  stop(retIndices: number[]): number {
    return this.setIndices(this.preset.faceMask, retIndices);
  }
}
