import { Color } from "@systemic-games/pixels-core-animation";
import { fromByteArray, toByteArray } from "base64-js";

import { EditRgbKeyframe } from "../edit";

export function fromKeyframes(keyframes?: Readonly<EditRgbKeyframe[]>): string {
  const array = new Uint8Array(8 * (keyframes?.length ?? 0));
  const dataView = new DataView(array.buffer);
  let byteOffset = 0;
  keyframes?.forEach((kf) => {
    dataView.setFloat32(byteOffset, kf.time ?? 0);
    byteOffset += 4;
    dataView.setUint32(byteOffset, kf.color.toColor32());
    byteOffset += 4;
  });
  return fromByteArray(array);
}

export function toKeyframes(base64: string): EditRgbKeyframe[] {
  const dataView = new DataView(toByteArray(base64).buffer);
  const keyframes: EditRgbKeyframe[] = [];
  let byteOffset = 0;
  const lengthMinus8 = dataView.byteLength - 8;
  while (byteOffset <= lengthMinus8) {
    const time = dataView.getFloat32(byteOffset);
    byteOffset += 4;
    const color = new Color(dataView.getUint32(byteOffset));
    byteOffset += 4;
    keyframes.push(new EditRgbKeyframe({ time, color }));
  }
  return keyframes;
}
