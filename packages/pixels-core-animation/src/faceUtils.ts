import { assert, bitsToIndices } from "@systemic-games/pixels-core-utils";

import { PixelDieType } from "./PixelDieType";

export function getFaceForLEDIndex(
  dieType: PixelDieType,
  ledIndex: number
): number {
  switch (dieType) {
    case "d6pipped":
      //  0   --1--   ----2----   ------3------   ---------4--------  ----------5----------- // Face index
      //  0   0   1   0   1   2   0   1   2   3    0   1   2   3   4   0   1   2   3   4   5 // Led index in face
      //  0,	5,	6,	7,	8,	9,	1,	2,	3,	4,	10,	11,	12,	13,	14,	15,	16,	17,	18,	19, 20,
      if (ledIndex === 0) {
        return 0;
      } else if (ledIndex <= 4) {
        return 3;
      } else if (ledIndex <= 6) {
        return 1;
      } else if (ledIndex <= 9) {
        return 2;
      } else if (ledIndex <= 14) {
        return 4;
      } else {
        return 5;
      }
    default:
      return ledIndex;
  }
}

export function getTopFace(dieType: PixelDieType): number {
  switch (dieType) {
    case "unknown":
      return 0;
    case "d20":
      return 19;
    case "d12":
      return 11;
    case "d10":
    case "d00":
      return 0;
    case "d8":
      return 7;
    default:
      return 5;
  }
}

export function getFaceCount(dieType: PixelDieType): number {
  switch (dieType) {
    case "unknown":
      return 0;
    case "d20":
      return 20;
    case "d12":
      return 12;
    case "d10":
    case "d00":
      return 10;
    case "d8":
      return 8;
    default:
      return 6;
  }
}

export function getLEDCount(dieType: PixelDieType): number {
  switch (dieType) {
    case "unknown":
      return 0;
    case "d20":
      return 20;
    case "d12":
      return 12;
    case "d10":
    case "d00":
      return 10;
    case "d8":
      return 8;
    case "d6pipped":
      return 21;
    default:
      return 6;
  }
}

/**
 * Convert a die face value or a list of face values to a face mask
 * for use with the animation classes.
 * @param faceValueOrFaceList A die face value or  list of face values.
 * @returns A face (bit) mask.
 * @category Face Utils
 */
export function getFaceMask(
  faceValueOrFaceList: number | number[],
  dieType: PixelDieType,
  firmwareTimestamp?: number
): number {
  if (typeof faceValueOrFaceList === "number") {
    switch (dieType) {
      case "d10":
      case "unknown":
        ++faceValueOrFaceList;
        break;
      case "d00":
        faceValueOrFaceList = 1 + Math.floor(faceValueOrFaceList / 10);
        break;
    }
    // Fix for old production FW 2024-01-02
    if (dieType === "d4") {
      if (
        firmwareTimestamp !== undefined &&
        firmwareTimestamp <= 1704150000000
      ) {
        switch (faceValueOrFaceList) {
          case 2:
            faceValueOrFaceList = 3;
            break;
          case 3:
            faceValueOrFaceList = 4;
            break;
          case 4:
            faceValueOrFaceList = 6;
            break;
        }
      } else {
        // TODO fix D4 face mask in FW
        switch (faceValueOrFaceList) {
          case 2:
            faceValueOrFaceList = 3;
            break;
          case 3:
            faceValueOrFaceList = 2;
            break;
        }
      }
    }
  }
  if (typeof faceValueOrFaceList === "number") {
    const n = faceValueOrFaceList;
    assert(
      n > 0 && n <= 32,
      `getFaceMask: Face value is out of range [1, 32], got ${n} for type ${dieType}`
    );
    return (1 << (n - 1)) >>> 0;
  } else {
    return faceValueOrFaceList.reduce(
      (mask, n) => getFaceMask(n, dieType) | mask,
      0
    );
  }
}

/**
 * Takes a faces mask (a bit mask) and returns the corresponding list of face values.
 * @param facesMask A faces (bits) mask.
 * @returns A list of face values.
 * @category Face Utils
 */
export function facesMaskToValues(facesMask: number): number[] {
  return bitsToIndices(facesMask).map((n) => n + 1);
}
