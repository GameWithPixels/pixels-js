import {
  assert,
  bitIndexToFlag,
  bitsToIndices,
  combineFlags,
} from "@systemic-games/pixels-core-utils";

const d20FaceIndices = [
  17, 1, 19, 13, 3, 10, 8, 5, 15, 7, 9, 11, 14, 4, 12, 0, 18, 2, 16, 6,
];

/**
 * Returns the face index (also the LED index) for a given die face value.
 * @param faceValue A face value.
 * @returns The corresponding face index.
 * @category Face Utils
 */
export function getFaceIndex(faceValue: number): number {
  return d20FaceIndices[Math.floor(faceValue)];
}

function getFaceMaskPd6(faceValue: number): number {
  let start = 0;
  for (let i = 1; i < faceValue; ++i) {
    start += i;
  }
  const ledsMasks = Array(faceValue);
  for (let i = start; i < start + faceValue; ++i) {
    ledsMasks[i - start] = bitIndexToFlag(i);
  }
  return combineFlags(ledsMasks);
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
  dieType: string // TODO PixelDieType
): number {
  if (typeof faceValueOrFaceList === "number") {
    switch (dieType) {
      case "d4":
        switch (faceValueOrFaceList) {
          case 1:
            break;
          case 2:
          case 3:
            ++faceValueOrFaceList;
            break;
          case 4:
            faceValueOrFaceList = 6;
            break;
          default:
            return 0;
        }
        break;
      case "d6pipped":
        return getFaceMaskPd6(faceValueOrFaceList);
      case "d10":
        ++faceValueOrFaceList;
        break;
      case "d00":
        faceValueOrFaceList = 1 + Math.round(faceValueOrFaceList / 10);
        break;
    }
  }
  if (typeof faceValueOrFaceList === "number") {
    const n = faceValueOrFaceList;
    assert(
      n > 0 && n <= 32,
      `getFaceMask: Face value is out of range [1, 32], got ${n}`
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
