import getFaceIndex from "../getFaceIndex";
import AnimationInstance from "./AnimationInstance";
import AnimationKeyframed from "./AnimationKeyframed";

/**
 * @category Animation Instance
 */
export default class AnimationInstanceKeyframed extends AnimationInstance {
  get preset(): AnimationKeyframed {
    return this.animationPreset as AnimationKeyframed;
  }

  /// <summary>
  /// Computes the list of LEDs that need to be on, and what their intensities should be
  /// based on the different tracks of this animation.
  /// </summary>
  updateLEDs(ms: number, retIndices: number[], retColors32: number[]): number {
    const time = ms - this.startTime;
    const preset = this.preset;

    const trackTime = (time * 1000) / preset.duration;

    // Each track will append its led indices and colors into the return array
    // The assumption is that led indices don't overlap between tracks of a single animation,
    // so there will always be enough room in the return arrays.
    let totalCount = 0;
    const indices: number[] = [];
    const colors32: number[] = [];
    for (let i = 0; i < preset.trackCount; ++i) {
      const track = this.animationBits.getRgbTrack(preset.tracksOffset + i);
      const count = track.evaluate(
        this.animationBits,
        trackTime,
        indices,
        colors32
      );
      for (let j = 0; j < count; ++j) {
        if (preset.flowOrder !== 0) {
          // Use reverse lookup so that the indices are actually led Indices, not face indices
          retIndices[totalCount + j] = getFaceIndex(indices[j]);
        } else {
          retIndices[totalCount + j] = indices[j];
        }
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
      const track = this.animationBits.getRgbTrack(preset.tracksOffset + i);
      const count = track.extractLEDIndices(indices);
      for (let j = 0; j < count; ++j) {
        retIndices[totalCount + j] = indices[j];
      }
      totalCount += count;
    }
    return totalCount;
  }
}
