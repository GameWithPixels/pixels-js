export function bitsToIndices(bits: number): number[] {
  const indices: number[] = [];

  let index = 0;
  //loop bits
  while (bits) {
    if (bits & 1) {
      indices.push(index);
    }
    bits = bits >> 1;
    ++index;
  }
  return indices;
}

export function toMask(index: number): number {
  return 1 << index;
}

export function combine(values: number[]): number {
  return values.reduce((prev, cur) => prev | cur);
}
