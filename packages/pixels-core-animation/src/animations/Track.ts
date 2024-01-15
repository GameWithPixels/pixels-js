import { assert, serializable } from "@systemic-games/pixels-core-utils";

import AnimationBits from "./AnimationBits";
import { Constants } from "./Constants";
import SimpleKeyframe from "./SimpleKeyframe";
import { Color32Utils } from "../color";

/**
 * Represents of a series of RGB keyframes which together make
 * an animation curve for a light intensity.
 * @category Animation
 */
export default class Track {
  @serializable(2)
  keyframesOffset = 0; /** Offset into a global keyframe buffer. */

  @serializable(1, { padding: 1 })
  keyFrameCount = 0; /** Keyframe count. */

  @serializable(4)
  ledMask = 0; /** Each bit indicates whether the led is included in the animation track. */

  /**
   * Gets the track duration.
   * @param bits The animation bits with the keyframes data.
   * @returns The track duration.
   */
  getDuration(bits: AnimationBits): number {
    const kf = bits.getRgbKeyframe(
      this.keyframesOffset + this.keyFrameCount - 1
    );
    return kf.time;
  }

  /**
   * Gets the data of the keyframe at the given index.
   * @param bits The animation bits with the keyframes data.
   * @param keyframeIndex The index of the keyframe.
   * @returns The keyframe data.
   */
  getKeyframe(bits: AnimationBits, keyframeIndex: number): SimpleKeyframe {
    assert(
      keyframeIndex >= 0 && keyframeIndex < this.keyFrameCount,
      `Invalid key frame index: ${keyframeIndex} (count: ${this.keyFrameCount})`
    );
    return bits.getKeyframe(this.keyframesOffset + keyframeIndex);
  }

  /**
   * Evaluates an animation track's for a given time, in milliseconds,
   * and fills returns arrays of led indices and colors.
   * The returned colors are the given color modulated with the light intensity
   * of the track for the given time.
   * Values outside the track's range are clamped to first or last keyframe
   * value.
   * @param bits The animation bits with the keyframes data and color palette.
   * @param color The color for which to modulate the intensity.
   * @param time The time at which to evaluate the track.
   * @param retIndices Array of LED indices to be updated.
   * @param retColors32 Array of 32 bits colors to be updated.
   * @returns The number of LED indices that have been set in the returned arrays.
   */
  evaluate(
    bits: AnimationBits,
    color: number,
    time: number,
    ledCount: number,
    retIndices: number[],
    retColors32: number[]
  ): number {
    if (this.keyFrameCount === 0) {
      return 0;
    }

    const modColor = Color32Utils.modulateColor(
      color,
      this.evaluateIntensity(bits, time)
    );

    // Fill the return arrays
    let currentCount = 0;
    for (let i = 0; i < ledCount; ++i) {
      if ((this.ledMask & (1 << i)) !== 0) {
        retIndices[currentCount] = i;
        retColors32[currentCount] = modColor;
        currentCount++;
      }
    }
    return currentCount;
  }

  /**
   * Evaluates an animation track's for a given time, in milliseconds.
   * Values outside the track's range are clamped to first or last keyframe
   * value.
   * @param bits The animation bits with the keyframes data and color palette.
   * @param time The time at which to evaluate the track.
   * @returns The modulated color.
   */
  evaluateIntensity(bits: AnimationBits, time: number): number {
    // Find the first keyframe
    let nextIndex = 0;
    while (
      nextIndex < this.keyFrameCount &&
      this.getKeyframe(bits, nextIndex).time < time
    ) {
      nextIndex++;
    }

    if (nextIndex === 0) {
      // The first keyframe is already after the requested time, clamp to first value
      return this.getKeyframe(bits, nextIndex).intensity;
    } else if (nextIndex === this.keyFrameCount) {
      // The last keyframe is still before the requested time, clamp to the last value
      return this.getKeyframe(bits, nextIndex - 1).intensity;
    } else {
      // Grab the prev and next keyframes
      const nextKeyframe = this.getKeyframe(bits, nextIndex);
      const nextKeyframeTime = nextKeyframe.time;
      const nextKeyframeIntensity = nextKeyframe.intensity;

      const prevKeyframe = this.getKeyframe(bits, nextIndex - 1);
      const prevKeyframeTime = prevKeyframe.time;
      const prevKeyframeIntensity = prevKeyframe.intensity;

      // Compute the interpolation parameter
      return Color32Utils.interpolateIntensity(
        prevKeyframeIntensity,
        prevKeyframeTime,
        nextKeyframeIntensity,
        nextKeyframeTime,
        time
      );
    }
  }

  /**
   * Extracts the LED indices from the LED bit mask.
   * @param retIndices Array of LED indices to be updated.
   * @returns The number of LED indices that have been set in the returned arrays.
   */
  extractLEDIndices(retIndices: number[]): number {
    // Fill the return arrays
    let currentCount = 0;
    for (let i = 0; i < Constants.maxLEDsCount; ++i) {
      if ((this.ledMask & (1 << i)) !== 0) {
        retIndices[currentCount] = i;
        currentCount++;
      }
    }
    return currentCount;
  }

  /**
   * Compares two Track instances.
   * @param other The Track instance to compare with.
   * @returns Whether the two Track instances have the same data.
   */
  equals(other: Track): boolean {
    return (
      this.keyframesOffset === other.keyframesOffset &&
      this.keyFrameCount === other.keyFrameCount &&
      this.ledMask === other.ledMask
    );
  }
}
