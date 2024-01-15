import { byteSizeOf, serialize } from "@systemic-games/pixels-core-utils";

import { Constants } from "./Constants";
import RgbKeyframe from "./RgbKeyframe";
import RgbTrack from "./RgbTrack";
import SimpleKeyframe from "./SimpleKeyframe";
import Track from "./Track";
import VirtualDie from "../VirtualDie";
import { align32bits } from "../align32bits";
import { Color, Color32Utils } from "../color";

/**
 * @category Animation
 */
export default class AnimationBits {
  readonly palette: Color[] = [];
  readonly rgbKeyframes: RgbKeyframe[] = [];
  readonly rgbTracks: RgbTrack[] = [];
  readonly keyframes: SimpleKeyframe[] = [];
  readonly tracks: Track[] = [];

  getColor32(colorIndex: number, die: Readonly<VirtualDie>): number {
    return Color32Utils.toColor32(this.getColor(colorIndex, die));
  }

  getColor(colorIndex: number, die: Readonly<VirtualDie>): Color {
    if (colorIndex === Constants.paletteColorFromFace) {
      return new Color(Color32Utils.faceWheel(die.currentFace, die.ledCount));
    } else if (colorIndex === Constants.paletteColorFromRandom) {
      return Color.black; // Not implemented
    } else {
      return this.getArrayItem(this.palette, colorIndex, "color");
    }
  }

  getPaletteSize(): number {
    return this.palette.length * 3;
  }

  getRgbKeyframe(keyframeIndex: number): RgbKeyframe {
    return this.getArrayItem(this.rgbKeyframes, keyframeIndex, "rgb keyframe");
  }

  getRgbKeyframeCount(): number {
    return this.rgbKeyframes.length;
  }

  getKeyframe(keyframeIndex: number): SimpleKeyframe {
    return this.getArrayItem(this.keyframes, keyframeIndex, "keyframe");
  }

  getKeyframeCount(): number {
    return this.keyframes.length;
  }

  getRgbTrack(trackIndex: number): RgbTrack {
    return this.getArrayItem(this.rgbTracks, trackIndex, "rgb track");
  }

  getRgbTrackCount(): number {
    return this.rgbTracks.length;
  }

  getTrack(trackIndex: number): Track {
    return this.getArrayItem(this.tracks, trackIndex, "track");
  }

  getTrackCount(): number {
    return this.tracks.length;
  }

  computeDataSize(): number {
    return (
      align32bits(this.palette.length * 3) + // 3 bytes per color
      byteSizeOf(this.rgbKeyframes) +
      byteSizeOf(this.rgbTracks) +
      byteSizeOf(this.keyframes) +
      byteSizeOf(this.tracks)
    );
  }

  serialize(dataView: DataView, byteOffset = 0): [DataView, number] {
    // Copy palette
    for (const c of this.palette) {
      [dataView, byteOffset] = c.serialize(dataView, byteOffset);
    }

    // Round up to nearest multiple of 4
    byteOffset = align32bits(byteOffset);

    // Copy keyframes
    [dataView, byteOffset] = serialize(this.rgbKeyframes, {
      dataView,
      byteOffset,
    });

    // Copy rgb tracks
    [dataView, byteOffset] = serialize(this.rgbTracks, {
      dataView,
      byteOffset,
    });

    // Copy keyframes
    [dataView, byteOffset] = serialize(this.keyframes, {
      dataView,
      byteOffset,
    });

    // Copy tracks
    [dataView, byteOffset] = serialize(this.tracks, { dataView, byteOffset });

    return [dataView, byteOffset];
  }

  private getArrayItem<T>(array: T[], index: number, name: string): T {
    const item = array[index];
    if (item === undefined) {
      // Throw an exception if index is out of bounds, invalid (negative or not an integer)
      // or if the item at the given index is not set or undefined (which is just as bad in our case)
      if (index < 0 || index >= array.length) {
        throw new Error(
          `Out of bound index for AnimationBits.${name}, got ${index} but array has ${array.length} item(s)`
        );
      } else {
        throw new Error(`No item for AnimationBits.${name} at index ${index}`);
      }
    }
    return item;
  }
}
