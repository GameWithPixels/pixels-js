import {
  AnimationBits,
  AnimationPreset,
  AnimationNoise,
  NoiseColorOverrideTypeValues,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditAnimation, { EditAnimationParams } from "./EditAnimation";
import EditDataSet from "./EditDataSet";
import EditRgbGradient from "./EditRgbGradient";
import EditRgbTrack from "./EditRgbTrack";
import { widget, range, name, observable, values } from "./decorators";

export default class EditAnimationNoise extends EditAnimation {
  readonly type = "noise";

  @widget("gradient")
  @name("Overall Gradient")
  @observable
  gradient?: EditRgbGradient;

  @widget("gradient")
  @name("Individual Gradient")
  @observable
  blinkGradient?: EditRgbGradient;

  @widget("slider")
  @range(0, 60)
  @name("Blink Frequency (Hz)")
  @observable
  blinkFrequency: number;

  @widget("slider")
  @range(0, 60)
  @name("Blink Frequency Variance (Hz)")
  @observable
  blinkFrequencyVar: number;

  @widget("slider")
  @range(0.001, 0.1)
  @name("Blink Duration")
  @observable
  blinkDuration: number;

  @widget("slider")
  @range(0, 1)
  @name("Fading Sharpness")
  @observable
  fade: number;

  @widget("toggle")
  @name("Override color based on face")
  @values(NoiseColorOverrideTypeValues)
  @observable
  mainGradientColorType: number;

  @widget("slider")
  @range(0, 1)
  @name("Override color variance")
  @observable
  mainGradientColorVar: number;

  constructor(
    opt?: EditAnimationParams & {
      gradient?: EditRgbGradient;
      blinkGradient?: EditRgbGradient;
      blinkFrequency?: number;
      blinkFrequencyVar?: number;
      blinkDuration?: number;
      fade?: number;
      mainGradientColorType?: number;
      mainGradientColorVar?: number;
    }
  ) {
    super(opt);
    this.gradient = opt?.gradient;
    this.blinkGradient = opt?.blinkGradient;
    this.blinkFrequency = opt?.blinkFrequency ?? 2;
    this.blinkFrequencyVar = opt?.blinkFrequencyVar ?? 0;
    this.blinkDuration = opt?.blinkDuration ?? 0.1;
    this.fade = opt?.fade ?? 0;
    this.mainGradientColorType =
      opt?.mainGradientColorType ?? NoiseColorOverrideTypeValues.none;
    this.mainGradientColorVar = opt?.mainGradientColorVar ?? 0;
  }

  toAnimation(editSet: EditDataSet, bits: AnimationBits): AnimationPreset {
    // Add gradient
    const gradientTrackOffset = bits.rgbTracks.length;
    if (this.gradient) {
      const track = new EditRgbTrack({ gradient: this.gradient });
      bits.rgbTracks.push(track.toTrack(editSet, bits));
    }
    const blinkTrackOffset = bits.rgbTracks.length;
    if (this.blinkGradient) {
      const track = new EditRgbTrack({ gradient: this.blinkGradient });
      bits.rgbTracks.push(track.toTrack(editSet, bits));
    }

    return safeAssign(new AnimationNoise(), {
      duration: this.duration * 1000,
      gradientTrackOffset,
      blinkTrackOffset,
      blinkFrequencyTimes1000: this.blinkFrequency * 1000,
      blinkFrequencyVarTimes1000: this.blinkFrequencyVar * 1000,
      blinkDuration: this.blinkDuration * 255,
      fade: this.fade * 255,
      overallGradientColorType: this.mainGradientColorType,
      overallGradientColorVar: this.mainGradientColorVar * 1000,
    });
  }

  duplicate(uuid?: string): EditAnimation {
    return new EditAnimationNoise({
      ...this,
      uuid,
      gradient: this.gradient?.duplicate(),
      blinkGradient: this.blinkGradient?.duplicate(),
    });
  }

  collectGradients(): EditRgbGradient[] {
    const gradients = [];
    this.gradient && gradients.push(this.gradient);
    this.blinkGradient && gradients.push(this.blinkGradient);
    return gradients;
  }
}
