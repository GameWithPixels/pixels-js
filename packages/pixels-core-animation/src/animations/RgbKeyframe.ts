import { serializable } from "@systemic-games/pixels-core-utils";

import AnimationBits from "./AnimationBits";

export default class RgbKeyframe {
  @serializable(2)
  timeAndColor = 0;

  // Time in ms
  time(): number {
    // Take the upper 9 bits and multiply by 2 (scale it to 0 -> 1024)
    return ((this.timeAndColor & 0xffff) >> 7) * 2;
  }

  colorIndex(): number {
    // Take the lower 7 bits for the index
    return this.timeAndColor & 0b1111111;
  }

  color(bits: AnimationBits): number {
    return bits.getColor32(this.colorIndex());
  }

  setTimeAndColorIndex(time: number, colorIndex: number): void {
    //TODO check colorIndex < 128
    const timeMs = Math.round(Math.max(0, time) * 1000);
    const scaledTime = (timeMs / 2) & 0b111111111;
    this.timeAndColor = (scaledTime << 7) | (colorIndex & 0b1111111);
  }

  equals(other: RgbKeyframe): boolean {
    return this.timeAndColor === other.timeAndColor;
  }
}
