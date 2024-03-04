/**
 * Map a list of keys to the corresponding list of values
 * according the passed object mapping keys to values.
 * @param keys Keys to map to values.
 * @param keyValues Object mapping keys to values.
 * @param onMissingKey Called when no value was found for a given key.
 * @returns List of corresponding values.
 */
export function keysToValues<T>(
  keys: string[],
  keyValues: { [key: string]: T },
  onMissingKey?: (key: string) => T
): T[] {
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
export function valuesToKeys<T, KeyValuesType extends { [key: string]: T }>(
  values: T[],
  keyValues: KeyValuesType,
  onMissingKey?: (value: T) => string
): (keyof KeyValuesType)[] {
  const ret: (keyof KeyValuesType)[] = [];
  for (const value of values) {
    const k = getValueKeyName(value, keyValues);
    if (k !== undefined) {
      ret.push(k);
    } else if (onMissingKey) {
      ret.push(onMissingKey(value));
    } else {
      throw new Error(`valuesToKeys: Missing key for value ${value}`);
    }
  }
  return ret;
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
