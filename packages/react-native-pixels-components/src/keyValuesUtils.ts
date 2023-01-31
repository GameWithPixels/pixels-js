/**
 * Map a list of keys to the corresponding list of values
 * according the passed object mapping keys to values.
 * @param keys Keys to map to values.
 * @param keyValues Object mapping keys to values.
 * @param defaultValue Value to use when none found for a given key.
 * @returns List of corresponding values.
 */
export function keysToValues<V>(
  keys: string[],
  keyValues: { [key: string]: V },
  defaultValue: V
): V[] {
  return keys.map((key) => {
    const k = keyValues[key];
    return k !== undefined ? k : defaultValue;
  });
}

/**
 * Map a list of values to the corresponding list of keys
 * according the passed object mapping keys to values.
 * @param values Values to map to keys.
 * @param keyValues Object mapping keys to values.
 * @param defaultKey Key to use when none found for a given value.
 * @returns List of corresponding keys.
 */
export function valuesToKeys<V>(
  values: V[],
  keyValues: { [key: string]: V },
  defaultKey = ""
): string[] {
  const valueToKey = new Map<V, string>();
  Object.entries(keyValues).forEach((e) => valueToKey.set(e[1], e[0]));
  return values.map((value) => valueToKey.get(value) ?? defaultKey);
}
