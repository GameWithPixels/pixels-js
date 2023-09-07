/**
 * Map a list of keys to the corresponding list of values
 * according the passed object mapping keys to values.
 * @param keys Keys to map to values.
 * @param keyValues Object mapping keys to values.
 * @param onMissingKey Called when no value was found for a given key.
 * @returns List of corresponding values.
 */
export function keysToValues<V>(
  keys: string[],
  keyValues: { [key: string]: V },
  onMissingKey?: (key: string) => V
): V[] {
  return keys.map((key) => {
    const v = keyValues[key];
    if (v !== undefined) {
      return v;
    } else if (onMissingKey) {
      return onMissingKey(key);
    } else {
      throw new Error(`keysToValues: Missing key ${key}`);
    }
  });
}

/**
 * Map a list of values to the corresponding list of keys
 * according the passed object mapping keys to values.
 * @param values Values to map to keys.
 * @param keyValues Object mapping keys to values.
 * @param onMissingKey Called when no key was found for a given value.
 * @returns List of corresponding keys.
 */
export function valuesToKeys<V, T extends { [key: string]: V }>(
  values: V[],
  keyValues: T,
  onMissingKey?: (value: V) => string
): (keyof T)[] {
  const valueToKey = new Map<V, string>();
  for (const e of Object.entries(keyValues)) {
    valueToKey.set(e[1], e[0]);
  }
  return values.map((value) => {
    const k = valueToKey.get(value);
    if (k !== undefined) {
      return k;
    } else if (onMissingKey) {
      return onMissingKey(value);
    } else {
      throw new Error(`valuesToKeys: Missing key for value ${value}`);
    }
  });
}

/**
 * Returns the key name corresponding to a given value
 * according the passed object mapping keys to values.
 * @param value The value.
 * @param keyValues Object mapping keys to values.
 * @returns A string with the name for the value.
 */
export function getValueKeyName<T, KeyValuesType extends { [key: string]: T }>(
  value: T,
  keyValues: KeyValuesType
): keyof KeyValuesType | undefined {
  for (const [key, val] of Object.entries(keyValues)) {
    if (val === value) {
      return key;
    }
  }
}
