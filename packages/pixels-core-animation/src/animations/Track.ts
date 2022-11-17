import { assert, serializable } from "@systemic-games/pixels-core-utils";

import * as Color32Utils from "../color/color32Utils";
import AnimationBits from "./AnimationBits";
import Constants from "./Constants";
import SimpleKeyframe from "./SimpleKeyframe";

export default class Track {
  @serializable(2)
  keyframesOffset = 0; // offset into a global keyframe buffer

  @serializable(1, { padding: 1 })
  keyFrameCount = 0; // Keyframe count

  @serializable(4)
  ledMask = 0; // Each bit indicates whether the led is included in the animation track

  getDuration(bits: AnimationBits): number {
    const kf = bits.getRgbKeyframe(
      this.keyframesOffset + this.keyFrameCount - 1
    );
    return kf.time();
  }

  getKeyframe(bits: AnimationBits, keyframeIndex: number): SimpleKeyframe {
    assert(
      keyframeIndex < this.keyFrameCount,
      `Invalid keyframeIndex ${keyframeIndex} < ${this.keyFrameCount}`
    );
    return bits.getKeyframe(this.keyframesOffset + keyframeIndex);
  }

  /// <summary>
  /// Evaluate an animation track's for a given time, in milliseconds, and fills returns arrays of led indices and colors
  /// Values outside the track's range are clamped to first or last keyframe value.
  /// </summary>
  evaluate(
    bits: AnimationBits,
    color: number,
    time: number,
    retIndices: number[],
    retColors32: number[]
  ): number {
    if (this.keyFrameCount === 0) {
      return 0;
    }

    const modColor = this.modulateColor(bits, color, time);

    // Fill the return arrays
    let currentCount = 0;
    for (let i = 0; i < Constants.maxLedsCount; ++i) {
      if ((this.ledMask & (1 << i)) !== 0) {
        retIndices[currentCount] = i;
        retColors32[currentCount] = modColor;
        currentCount++;
      }
    }
    return currentCount;
  }

  /// <summary>
  /// Evaluate an animation track's for a given time, in milliseconds
  /// Values outside the track's range are clamped to first or last keyframe value.
  /// </summary>
  modulateColor(bits: AnimationBits, color: number, time: number): number {
    // Find the first keyframe
    let nextIndex = 0;
    while (
      nextIndex < this.keyFrameCount &&
      this.getKeyframe(bits, nextIndex).time() < time
    ) {
      nextIndex++;
    }

    let intensity = 0;
    if (nextIndex === 0) {
      // The first keyframe is already after the requested time, clamp to first value
      intensity = this.getKeyframe(bits, nextIndex).intensity();
    } else if (nextIndex === this.keyFrameCount) {
      // The last keyframe is still before the requested time, clamp to the last value
      intensity = this.getKeyframe(bits, nextIndex - 1).intensity();
    } else {
      // Grab the prev and next keyframes
      const nextKeyframe = this.getKeyframe(bits, nextIndex);
      const nextKeyframeTime = nextKeyframe.time();
      const nextKeyframeIntensity = nextKeyframe.intensity();

      const prevKeyframe = this.getKeyframe(bits, nextIndex - 1);
      const prevKeyframeTime = prevKeyframe.time();
      const prevKeyframeIntensity = prevKeyframe.intensity();

      // Compute the interpolation parameter
      intensity = Color32Utils.interpolateIntensity(
        prevKeyframeIntensity,
        prevKeyframeTime,
        nextKeyframeIntensity,
        nextKeyframeTime,
        time
      );
    }

    return Color32Utils.modulateColor(color, intensity);
  }

  /// <summary>
  /// Extracts the LED indices from the led bit mask
  /// </summary>
  extractLEDIndices(retIndices: number[]): number {
    // Fill the return arrays
    let currentCount = 0;
    for (let i = 0; i < Constants.maxLedsCount; ++i) {
      if ((this.ledMask & (1 << i)) !== 0) {
        retIndices[currentCount] = i;
        currentCount++;
      }
    }
    return currentCount;
  }

  equals(other: Track): boolean {
    return (
      this.keyframesOffset === other.keyframesOffset &&
      this.keyFrameCount === other.keyFrameCount &&
      this.ledMask === other.ledMask
    );
  }
}