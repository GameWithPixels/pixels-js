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

export function toMask(index: number): number {
  // Use pow() function rather than bit shifting operator because of issues
  // with the later (ex: 1 << 31 => -2147483648)
  return Math.pow(2, index);
}

export function combine(values: number[]): number {
  return values.reduce((prev, cur) => prev | cur);
}
