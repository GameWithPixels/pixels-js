import AnimationGradientPattern from "./AnimationGradientPattern";
import AnimationInstance from "./AnimationInstance";
import { Constants } from "./Constants";

/**
 * @category Animation Instance
 */
export default class AnimationInstanceGradientPattern extends AnimationInstance {
  private _rgb = 0;

  get preset(): AnimationGradientPattern {
    return this.animationPreset as AnimationGradientPattern;
  }

  start(startTime: number): void {
    super.start(startTime);
    if (this.preset.overrideWithFace) {
      this._rgb = this.bits.getColor32(
        Constants.paletteColorFromFace,
        this.die
      );
    }
  }

  /// <summary>
  /// Computes the list of LEDs that need to be on, and what their intensities should be
  /// based on the different tracks of this animation.
  /// </summary>
  updateLEDs(ms: number, retIndices: number[], retColors32: number[]): number {
    const preset = this.preset;
    const ledCount = this.die.ledCount;
    const time = ms - this.startTime;
    const trackTime = (time * 1000) / preset.duration;

    // Figure out the color from the gradient
    const gradient = this.bits.getRgbTrack(preset.gradientTrackOffset);

    let gradientColor = 0;
    if (preset.overrideWithFace) {
      gradientColor = this._rgb;
    } else {
      gradientColor = gradient.evaluateColor(trackTime, this.bits, this.die);
    }

    // Each track will append its led indices and colors into the return array
    // The assumption is that led indices don't overlap between tracks of a single animation,
    // so there will always be enough room in the return arrays.
    let totalCount = 0;
    const indices: number[] = [];
    const colors32: number[] = [];
    for (let i = 0; i < preset.trackCount; ++i) {
      const track = this.bits.getTrack(preset.tracksOffset + i);
      const count = track.evaluate(
        this.bits,
        gradientColor,
        trackTime,
        ledCount,
        indices,
        colors32
      );
      for (let j = 0; j < count; ++j) {
        retIndices[totalCount + j] = indices[j];
        retColors32[totalCount + j] = colors32[j];
      }
      totalCount += count;
    }
    return totalCount;
  }

  stop(retIndices: number[]): number {
    const preset = this.preset;
    // Each track will append its led indices and colors into the return array
    // The assumption is that led indices don't overlap between tracks of a single animation,
    // so there will always be enough room in the return arrays.
    let totalCount = 0;
    const indices: number[] = [];
    for (let i = 0; i < preset.trackCount; ++i) {
      const track = this.bits.getRgbTrack(preset.tracksOffset + i);
      const count = track.extractLEDIndices(indices);
      for (let j = 0; j < count; ++j) {
        retIndices[totalCount + j] = indices[j];
      }
      totalCount += count;
    }
    return totalCount;
  }
}
