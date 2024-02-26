import { assert, serializable } from "@systemic-games/pixels-core-utils";

import AnimationBits from "./AnimationBits";
import { AnimConstants } from "./Constants";
import RgbKeyframe from "./RgbKeyframe";
import VirtualDie from "../VirtualDie";
import { Color32Utils } from "../color";

/**
 * Represents of a series of RGB keyframes which together make
 * an animation curve for an RGB color.
 * @category Animation
 */
export default class RgbTrack {
  @serializable(2)
  keyframesOffset = 0; /** Offset into a global keyframe buffer. */

  @serializable(1, { padding: 1 })
  keyFrameCount = 0; /** Keyframe count. */

  @serializable(4)
  ledMask = 0; /** Each bit indicates whether the led is included in the animation track. */

  /**
   * Gets the track duration.
   * @param bits The animation bits with the RGB keyframes data.
   * @returns The track duration.
   */
  getDuration(bits: AnimationBits): number {
    const kf = bits.getRgbKeyframe(
      this.keyframesOffset + this.keyFrameCount - 1
    );
    return kf.time;
  }

  /**
   * Gets the data of the RGB keyframe at the given index.
   * @param bits The animation bits with the RGB keyframes data.
   * @param keyframeIndex The index of the keyframe.
   * @returns The RGB keyframe data.
   */
  getKeyframe(bits: AnimationBits, keyframeIndex: number): RgbKeyframe {
    assert(
      keyframeIndex >= 0 && keyframeIndex < this.keyFrameCount,
      `Invalid key frame index: ${keyframeIndex} (count: ${this.keyFrameCount})`
    );
    return bits.getRgbKeyframe(this.keyframesOffset + keyframeIndex);
  }

  /**
   * Evaluate an animation track's for a given time, in milliseconds,
   * and fills returns arrays of led indices and colors.
   * The returned colors are the color of the track for the given time.
   * Values outside the track's range are clamped to first or last keyframe
   * value.
   * @param time The time at which to evaluate the track.
   * @param bits The animation bits with the RGB keyframes data and color palette.
   * @param die The virtual die on which the animation is running.
   * @param retIndices Array of LED indices to be updated.
   * @param retColors32 Array of 32 bits colors to be updated.
   * @returns The number of LED indices that have been set in the returned arrays.
   */
  evaluate(
    time: number,
    bits: AnimationBits,
    die: VirtualDie,
    retIndices: number[],
    retColors32: number[]
  ): number {
    if (this.keyFrameCount === 0) {
      return 0;
    }

    const color = this.evaluateColor(time, bits, die);

    // Fill the return arrays
    let currentCount = 0;
    for (let i = 0; i < AnimConstants.maxLEDsCount; ++i) {
      if ((this.ledMask & (1 << i)) !== 0) {
        retIndices[currentCount] = i;
        retColors32[currentCount] = color;
        currentCount++;
      }
    }
    return currentCount;
  }

  /**
   * Evaluate an animation track's color for a given time, in milliseconds.
   * Values outside the track's range are clamped to first or last keyframe
   * value.
   * @param time The time at which to evaluate the track.
   * @param bits The animation bits with the RGB keyframes data and color palette.
   * @param die The virtual die on which the animation is running.
   * @returns The modulated color.
   */
  evaluateColor(time: number, bits: AnimationBits, die: VirtualDie): number {
    if (this.keyFrameCount === 0) {
      return 0;
    }

    // Find the first keyframe
    let nextIndex = 0;
    while (
      nextIndex < this.keyFrameCount &&
      this.getKeyframe(bits, nextIndex).time < time
    ) {
      nextIndex++;
    }

    let color = 0;
    if (nextIndex === 0) {
      // The first keyframe is already after the requested time, clamp to first value
      color = this.getKeyframe(bits, nextIndex).getColor(bits, die);
    } else if (nextIndex === this.keyFrameCount) {
      // The last keyframe is still before the requested time, clamp to the last value
      color = this.getKeyframe(bits, nextIndex - 1).getColor(bits, die);
    } else {
      // Grab the prev and next keyframes
      const nextKeyframe = this.getKeyframe(bits, nextIndex);
      const nextKeyframeTime = nextKeyframe.time;
      const nextKeyframeColor = nextKeyframe.getColor(bits, die);

      const prevKeyframe = this.getKeyframe(bits, nextIndex - 1);
      const prevKeyframeTime = prevKeyframe.time;
      const prevKeyframeColor = prevKeyframe.getColor(bits, die);

      // Compute the interpolation parameter
      color = Color32Utils.interpolateColors(
        prevKeyframeColor,
        prevKeyframeTime,
        nextKeyframeColor,
        nextKeyframeTime,
        time
      );
    }

    return color;
  }

  /**
   * Extracts the LED indices from the LED bit mask.
   * @param retIndices Array of LED indices to be updated.
   * @returns he number of LED indices that have been set in the returned arrays.
   */
  extractLEDIndices(retIndices: number[]): number {
    // Fill the return arrays
    let currentCount = 0;
    for (let i = 0; i < AnimConstants.maxLEDsCount; ++i) {
      if ((this.ledMask & (1 << i)) !== 0) {
        retIndices[currentCount] = i;
        currentCount++;
      }
    }
    return currentCount;
  }

  /**
   * Compares two RgbTrack instances.
   * @param other The RgbTrack instance to compare with.
   * @returns Whether the two RgbTrack instances have the same data.
   */
  equals(other: RgbTrack): boolean {
    return (
      this.keyframesOffset === other.keyframesOffset &&
      this.keyFrameCount === other.keyFrameCount &&
      this.ledMask === other.ledMask
    );
  }
}
