import AnimationCycle from "./AnimationCycle";
import AnimationInstance from "./AnimationInstance";
import { Constants } from "./Constants";
import * as Color32Utils from "../color/color32Utils";
import * as GammaUtils from "../color/gammaUtils";
import { getFaceIndex } from "../faceUtils";

/**
 * @category Animation Instance
 */
export default class AnimationInstanceCycle extends AnimationInstance {
  get preset(): AnimationCycle {
    return this.animationPreset as AnimationCycle;
  }

  updateLEDs(ms: number, retIndices: number[], retColors32: number[]): number {
    const preset = this.preset;

    // Compute color
    const fadeTime = (preset.duration * preset.fade) / (255 * 2);
    const time = ms - this.startTime;

    const wheelPos = ((time * preset.count * 255) / preset.duration) % 256;

    let intensity = 255;
    if (time <= fadeTime) {
      // Ramp up
      intensity = (time * 255) / fadeTime;
    } else if (time >= preset.duration - fadeTime) {
      // Ramp down
      intensity = ((preset.duration - time) * 255) / fadeTime;
    }

    let retCount = 0;
    if (preset.animFlags) {
      // Fill the indices and colors for the anim controller to know how to update LEDs
      for (let i = 0; i < Constants.maxLEDsCount; ++i) {
        if ((preset.faceMask & (1 << i)) !== 0) {
          retIndices[retCount] = getFaceIndex(i);
          retColors32[retCount] = GammaUtils.gamma32(
            Color32Utils.rainbowWheel(
              (wheelPos + (i * 256) / Constants.maxLEDsCount) % 256,
              intensity
            )
          );
          retCount++;
        }
      }
    } else {
      // All LEDs same color
      const color = GammaUtils.gamma32(
        Color32Utils.rainbowWheel(wheelPos, intensity)
      );

      // Fill the indices and colors for the anim controller to know how to update LEDs
      for (let i = 0; i < Constants.maxLEDsCount; ++i) {
        if ((preset.faceMask & (1 << i)) !== 0) {
          retIndices[retCount] = i;
          retColors32[retCount] = color;
          retCount++;
        }
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
