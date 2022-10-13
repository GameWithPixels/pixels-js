const faceIndices = [
  17, 1, 19, 13, 3, 10, 8, 5, 15, 7, 9, 11, 14, 4, 12, 0, 18, 2, 16, 6,
];

export default function (faceValue: number): number {
  return faceIndices[Math.floor(faceValue)];
}
