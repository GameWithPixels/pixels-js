export function bitsToIndices(value: number): number[] {
  const indices: number[] = [];

  // Convert value into binary: we use a string because of issues with
  // JS bits operators (ex: 0x80000000 >> 1 => -1073741824 )
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

export function combineBits(bitMasks: number[]): number {
  return bitMasks.reduce((prev, cur) => prev + cur);
}
