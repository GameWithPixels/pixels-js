import { assert } from "@systemic-games/pixels-core-utils";

/**
 * Convert a die face value or a list of face values to a bit mask
 * for use with the animation classes.
 * @param faceValueOrFaceList A die face value or  list of face values.
 * @returns A bit mask.
 */
export default function getFaceMask(
  faceValueOrFaceList: number | number[]
): number {
  if (typeof faceValueOrFaceList === "number") {
    const n = faceValueOrFaceList;
    assert(n > 0, `Face value must be greater than 0 but got ${n}`);
    assert(n < 32, `Face value must be lesser than 32 but got ${n}`);
    return (1 << (n - 1)) >>> 0;
  } else {
    return faceValueOrFaceList.reduce((n, curr) => getFaceMask(n) + curr);
  }
}
