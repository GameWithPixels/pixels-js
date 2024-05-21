import { serializable } from "@systemic-games/pixels-core-utils";

/**
 * Stores a single keyframe of an LED animation,
 * The keyframe is made of a time and an intensity.
 * @category Animation
 */
export default class SimpleKeyframe {
  @serializable(2)
  timeAndIntensity =
    0; /** The time and intensity combined in one value for serialization. */

  /**
   * Gets the time in milliseconds, from to 0 to 1024 excluded.
   */
  get time(): number {
    // Take the upper 9 bits and multiply by 2 (scale it to 0 -> 1024)
    return ((this.timeAndIntensity & 0xffff) >> 7) * 2;
  }

  /**
   * Gets the light intensity, from to 0 to 255 excluded.
   */
  get intensity(): number {
    // Take the lower 7 bits and multiply by 2 (scale it to 0 -> 255)
    return (this.timeAndIntensity & 0b1111111) * 2;
  }

  /**
   * Updates the instance timeAndIntensity member with the given time
   * and intensity.
   * @param time The time in milliseconds, from to 0 to 1024 excluded.
   * @param intensity The light intensity, from to 0 to 255 excluded.
   */
  setTimeAndIntensity(time: number, intensity: number): void {
    const timeMs = Math.round(Math.max(0, time) * 1000);
    const scaledTime = (timeMs / 2) & 0b111111111;
    const scaledIntensity = Math.floor(intensity / 2) & 0b1111111;
    this.timeAndIntensity = (scaledTime << 7) | scaledIntensity;
  }

  /**
   * Compares two SimpleKeyframe instances.
   * @param other The SimpleKeyframe instance to compare with.
   * @returns Whether the two SimpleKeyframe instances have the same data.
   */
  equals(other: SimpleKeyframe): boolean {
    return this.timeAndIntensity === other.timeAndIntensity;
  }
}
