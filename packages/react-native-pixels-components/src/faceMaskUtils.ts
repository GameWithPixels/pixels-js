export function bitsToIndices(value: number): number[] {
  const indices: number[] = [];

  // Convert value into binary
  // We use a string because of the limitation of JS bits operators
  let bits = value.toString(2);
  let index = 0;
  while (bits.length) {
    if (bits[bits.length - 1] === "1") {
      indices.push(index);
    }
    bits = bits.substring(0, bits.length - 1);
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
