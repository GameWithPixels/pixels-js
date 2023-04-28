import assert from "./assert";

/**
 * Returns the indices of the "on" bits of the given value.
 * @param value  The value to use.
 * @returns The indices of the "on" bits.
 */
export function bitsToIndices(value?: number): number[] {
  const indices: number[] = [];
  if (value) {
    // Convert value to binary format: we use a string because of the limitations
    // with JS bits operators (ex: 0x80000000 >> 1 => -1073741824 )
    let bits = value.toString(2);
    let index = 0;
    while (bits.length) {
      if (bits.at(-1) === "1") {
        indices.push(index);
      }
      bits = bits.substring(0, bits.length - 1);
      ++index;
    }
  }
  return indices;
}

/**
 * Decompose the given value into the corresponding list of flags.
 * @remarks In this context, a flag is a 2^n value.
 * @param value  The value to use.
 * @returns The flags corresponding to the "on" bits.
 */
export function bitsToFlags(value?: number): number[] {
  return bitsToIndices(value).map(bitIndexToFlag);
}

/**
 * Combines the given values into a single one by OR-ing them.
 * This is most useful when combining flags.
 * @remarks In this context, a flag is a 2^n value.
 * @remarks Because of the limitations of the OR operator, the given flags must be less than 2^31.
 * @param flags List of numbers (flags) to combine.
 * @returns The combined value.
 */
export function combineFlags(flags: number[]): number {
  return flags.reduce((mask, f) => {
    assert(
      f < 0x80000000,
      "combineFlags: Flag value greater or equal to 2^31, can't combine using OR operator"
    );
    return mask | f;
  }, 0);
}

/**
 * Converts a given bit index to the corresponding flag value.
 * @remarks In this context, a flag is a 2^n value.
 * @remarks Because the value is returned as a 64 bits floating point number with a 52 bits mantissa,
 * the given bit index must be less than 53.
 * @param bitIndex A bit index.
 * @returns The flag value for the given bit index.
 */
export function bitIndexToFlag(bitIndex: number) {
  assert(
    bitIndex < 53,
    "bitIndexToFlag: Bit index greater than maximum precision of 64 bits floating-point numbers (52 bits mantissa)"
  );
  return Math.pow(2, bitIndex);
}
