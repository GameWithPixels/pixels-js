import { serializable } from "@systemic-games/pixels-core-utils";

import AnimationBits from "./AnimationBits";

/**
 * Stores a single keyframe of an LED animation.
 * The keyframe is made of a time and a color index.
 * @category Animation
 */
export default class RgbKeyframe {
  @serializable(2)
  timeAndColor = 0; /** The time and color index combined in one value for serialization. */

  /**
   * Gets the color index, from to 0 to 128 excluded.
   */
  get time(): number {
    // Take the upper 9 bits and multiply by 2 (scale it to 0 -> 1024)
    return ((this.timeAndColor & 0xffff) >> 7) * 2;
  }

  /**
   * Gets the color index, from to 0 to 128 excluded.
   */
  get colorIndex(): number {
    // Take the lower 7 bits for the index
    return this.timeAndColor & 0b1111111;
  }

  /**
   * Gets the 32 bits color for the color index of this instance.
   * @param bits The animation bits with the color palette.
   * @returns The 32 bits color for the instance color index.
   */
  getColor(bits: AnimationBits): number {
    return bits.getColor32(this.colorIndex);
  }

  /**
   * Updates the instance timeAndColor member with the given time and color index.
   * @param time The time in milliseconds, from to 0 to 1024 excluded.
   * @param colorIndex The color index, from to 0 to 128 excluded.
   */
  setTimeAndColorIndex(time: number, colorIndex: number): void {
    // TODO check colorIndex < 128
    const timeMs = Math.round(Math.max(0, time) * 1000);
    const scaledTime = (timeMs / 2) & 0b111111111;
    this.timeAndColor = (scaledTime << 7) | (colorIndex & 0b1111111);
  }

  /**
   * Compares two RgbKeyframe instances.
   * @param other The RgbKeyframe instance to compare with.
   * @returns Whether the two RgbKeyframe instances have the same data.
   */
  equals(other: RgbKeyframe): boolean {
    return this.timeAndColor === other.timeAndColor;
  }
}
