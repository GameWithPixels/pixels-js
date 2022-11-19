const faceIndices = [
  17, 1, 19, 13, 3, 10, 8, 5, 15, 7, 9, 11, 14, 4, 12, 0, 18, 2, 16, 6,
];

/**
 * Returns the face index (also the LED index) for a give face value.
 * @param faceValue A face value.
 * @returns The corresponding face index.
 */
export default function (faceValue: number): number {
  return faceIndices[Math.floor(faceValue)];
}
