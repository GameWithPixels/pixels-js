export function offsetIndex<T>(i: number, offset: number, array: readonly T[]) {
  return (i + offset + array.length) % array.length;
}
