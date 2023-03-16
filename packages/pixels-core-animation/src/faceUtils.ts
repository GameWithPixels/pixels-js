import { assert, bitsToIndices } from "@systemic-games/pixels-core-utils";

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

/**
 * Convert a die face value or a list of face values to a face mask
 * for use with the animation classes.
 * @param faceValueOrFaceList A die face value or  list of face values.
 * @returns A face (bit) mask.
 * @category Face Utils
 */
export function getFaceMask(faceValueOrFaceList: number | number[]): number {
  if (typeof faceValueOrFaceList === "number") {
    const n = faceValueOrFaceList;
    assert(
      n > 0 && n <= 32,
      `getFaceMask: Face value is out of range [1, 32], got ${n}`
    );
    return (1 << (n - 1)) >>> 0;
  } else {
    return faceValueOrFaceList.reduce((mask, n) => getFaceMask(n) | mask, 0);
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
