export function getHighestFace(faces: number[] | "all"): number {
  if (faces === "all" || faces.length === 0) {
    return -1;
  } else {
    return Math.max(...faces);
  }
}
