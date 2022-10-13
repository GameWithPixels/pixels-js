import { serializable } from "@systemic-games/pixels-core-utils";

export default class SimpleKeyframe {
  @serializable(2)
  timeAndIntensity = 0;

  time(): number {
    // Take the upper 9 bits and multiply by 2 (scale it to 0 -> 1024)
    return ((this.timeAndIntensity & 0xffff) >> 7) * 2;
  }

  intensity(): number {
    // Take the lower 7 bits and multiply by 2 (scale it to 0 -> 255)
    return (this.timeAndIntensity & 0b1111111) * 2;
  }

  setTimeAndIntensity(time: number, intensity: number): void {
    const timeMs = Math.round(Math.max(0, time) * 1000);
    const scaledTime = (timeMs / 2) & 0b111111111;
    const scaledIntensity = Math.floor(intensity / 2) & 0b1111111;
    this.timeAndIntensity = (scaledTime << 7) | scaledIntensity;
  }

  equals(other: SimpleKeyframe): boolean {
    return this.timeAndIntensity === other.timeAndIntensity;
  }
}
