import { AnimationFlagsValues } from "./AnimationFlags";
import AnimationInstance from "./AnimationInstance";
import AnimationRainbow from "./AnimationRainbow";
import { Constants } from "./Constants";
import * as Color32Utils from "../color/color32Utils";
import * as GammaUtils from "../color/gammaUtils";
import { getFaceIndex } from "../faceUtils";

/**
 * @category Animation Instance
 */
export default class AnimationInstanceRainbow extends AnimationInstance {
  get preset(): AnimationRainbow {
    return this.animationPreset as AnimationRainbow;
  }

  updateLEDs(ms: number, retIndices: number[], retColors32: number[]): number {
    const preset = this.preset;

    // Compute color
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
