// Remove undefined properties from given object
function prune<T>(obj: Partial<T>): Partial<T> {
  Object.keys(obj).forEach(
    (key) => obj[key as keyof T] === undefined && delete obj[key as keyof T]
  );
  return obj;
}

/**
 * Initializes the members of a object with a set of values, in a type safe way.
 * Properties that are undefined in "values" are skipped.
 */
export function safeAssign<T extends object>(obj: T, values: Partial<T>): T {
  return Object.assign(obj, prune(values));
}
