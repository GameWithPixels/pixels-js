/**
 * Applies D. J. Bernstein hash function on the data.
 * @param data The data to hash stored in a Uint8Array array.
 * @returns The hash for the given data.
 */
export function bernsteinHash(data: Uint8Array): number {
  let hash = 5381;
  for (let i = 0; i < data.length; ++i) {
    hash = (33 * hash) ^ data[i];
  }
  return hash >>> 0;
}
