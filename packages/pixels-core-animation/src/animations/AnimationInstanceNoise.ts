import AnimationInstance from "./AnimationInstance";
import AnimationNoise from "./AnimationNoise";
import { Constants } from "./Constants";
import { NoiseColorOverrideTypeValues } from "./NoiseColorOverrideType";
import VirtualDie from "../VirtualDie";
import { Color32Utils } from "../color";
import { randomUInt32 } from "../randomUInt32";

const MAX_RETRIES = 5;

function computeBaseParam(type: number, virtualDie: VirtualDie): number {
  switch (type) {
    case NoiseColorOverrideTypeValues.faceToGradient:
      return (virtualDie.currentFace * 1000) / virtualDie.faceCount;
    case NoiseColorOverrideTypeValues.faceToRainbowWheel:
      return (virtualDie.currentFace * 256) / virtualDie.faceCount;
    case NoiseColorOverrideTypeValues.randomFromGradient:
    case NoiseColorOverrideTypeValues.none:
    default:
      return 0;
  }
}

/**
 * @category Animation Instance
 */
export default class AnimationInstanceNoise extends AnimationInstance {
  get preset(): AnimationNoise {
    return this.animationPreset as AnimationNoise;
  }

  private nextBlinkTime = 0;
  private readonly blinkStartTimes: number[] = []; // state that keeps track of the start of every individual blink so as to know how to fade it based on the time
  private readonly blinkDurations: number[] = []; // keeps track of the duration of each individual blink, so as to add a bit of variation
  private readonly blinkColors: number[] = [];
  private blinkInterValMinMs = 0;
  private blinkInterValDeltaMs = 0;
  private baseColorParam = 0;

  start(startTime: number): void {
    super.start(startTime);
    const preset = this.preset;

    this.blinkInterValMinMs =
      1000000 /
      (preset.blinkFrequencyTimes1000 + preset.blinkFrequencyVarTimes1000);
    const blinkInterValMaxMs =
      1000000 /
      (preset.blinkFrequencyTimes1000 - preset.blinkFrequencyVarTimes1000);
    this.blinkInterValDeltaMs = Math.max(
      blinkInterValMaxMs - this.blinkInterValMinMs,
      1
    );

    // initializing the durations and times of each blink
    for (let i = 0; i < Constants.maxLEDsCount; i++) {
      this.blinkStartTimes[i] = 0;
      this.blinkDurations[i] = 0;
    }

    this.nextBlinkTime =
      startTime +
      this.blinkInterValMinMs +
      (randomUInt32() % this.blinkInterValDeltaMs);
    this.baseColorParam = computeBaseParam(preset.gradientColorType, this.die);
  }

  updateLEDs(ms: number, retIndices: number[], retColors32: number[]): number {
    const preset = this.preset;
    const ledCount = this.die.ledCount;
    const time = ms - this.startTime;
    const fadeTime = (preset.duration * preset.fade) / (255 * 2);

    // LEDs will pick an initial color from the overall gradient (generally black to white)
    const gradientOverall = this.bits.getRgbTrack(preset.gradientTrackOffset);
    // they will then fade according to the individual gradient
    const gradientIndividual = this.bits.getRgbTrack(preset.blinkTrackOffset);

    let intensity = 255;
    if (time <= fadeTime) {
      // Ramp up
      intensity = (time * 255) / fadeTime;
    } else if (time >= preset.duration - fadeTime) {
      // Ramp down
      intensity = ((preset.duration - time) * 255) / fadeTime;
    }

    // Should we start a new blink instance?
    if (ms >= this.nextBlinkTime) {
      // Yes, pick an led!
      let newLed = randomUInt32() % ledCount;
      for (
        let retries = 0;
        this.blinkDurations[newLed] !== 0 && retries < MAX_RETRIES;
        ++retries
      ) {
        newLed = randomUInt32() % ledCount;
      }

      // Setup next blink
      this.blinkDurations[newLed] = preset.blinkDuration;
      this.blinkStartTimes[newLed] = ms;

      let gradientColor = 0;
      switch (preset.gradientColorType) {
        case NoiseColorOverrideTypeValues.randomFromGradient:
          // Ignore instance gradient parameter, each blink gets a random value
          gradientColor = gradientOverall.evaluateColor(
            randomUInt32() % 1000,
            this.bits,
            this.die
          );
          break;
        case NoiseColorOverrideTypeValues.faceToGradient:
          {
            // use the current face (set at start()) + variance
            const variance =
              Math.floor(
                randomUInt32() % Math.max(1, 2 * preset.gradientColorVar)
              ) - preset.gradientColorVar;
            let param = this.baseColorParam + variance;
            if (param < 0) {
              param = 0;
            } else if (param > 1000) {
              param = 1000;
            }
            gradientColor = gradientOverall.evaluateColor(
              param,
              this.bits,
              this.die
            );
          }
          break;
        case NoiseColorOverrideTypeValues.faceToRainbowWheel:
          {
            // use the current face (set at start()) + variance
            const variance =
              Math.floor(
                randomUInt32() % Math.max(1, 2 * preset.gradientColorVar)
              ) - preset.gradientColorVar;
            const param = this.baseColorParam + (variance * 255) / 1000;
            gradientColor = Color32Utils.rainbowWheel(param);
          }
          break;
        case NoiseColorOverrideTypeValues.none:
        default:
          {
            const gradientTime = (time * 1000) / preset.duration;
            gradientColor = gradientOverall.evaluateColor(
              gradientTime,
              this.bits,
              this.die
            );
          }
          break;
      }

      this.blinkColors[newLed] = gradientColor;
      this.nextBlinkTime =
        ms +
        this.blinkInterValMinMs +
        (randomUInt32() % this.blinkInterValDeltaMs);
    }

    let retCount = 0; // number that indicates how many LEDs to light up in their current cycle
    for (let i = 0; i < ledCount; ++i) {
      if (this.blinkDurations[i] > 0) {
        // Update this blink
        const blinkTime = ms - this.blinkStartTimes[i];
        if (blinkTime > this.blinkDurations[i]) {
          // This blink is over, return black this one time
          retIndices[retCount] = i;
          retColors32[retCount] = 0;
          retCount++;

          // and clear the array entry
          this.blinkDurations[i] = 0;
          this.blinkStartTimes[i] = 0;
        } else {
          // Process this blink
          const blinkGradientTime = (blinkTime * 1000) / this.blinkDurations[i];
          const blinkColor = gradientIndividual.evaluateColor(
            blinkGradientTime,
            this.bits,
            this.die
          );
          retIndices[retCount] = i;
          retColors32[retCount] = Color32Utils.modulateColor(
            Color32Utils.mulColors(this.blinkColors[i], blinkColor),
            intensity
          );
          retCount++;
        }
      }
      // Else skip
    }
    return retCount;
  }

  stop(retIndices: number[]): number {
    return this.setIndices(Constants.faceMaskAll, retIndices);
  }
}
