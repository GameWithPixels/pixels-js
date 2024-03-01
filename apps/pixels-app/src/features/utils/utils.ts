export function notEmpty<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function areArraysEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a === b) {
    return true;
  }
  const length = a.length;
  if (length !== b.length) {
    return false;
  }
  for (let i = 0; i < length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
