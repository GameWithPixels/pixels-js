import { Serializable } from "@systemic-games/react-native-pixels-connect";

export function insert<T extends Serializable.UniqueData>(
  value: T,
  array: T[],
  afterUuid?: string
) {
  if (afterUuid) {
    const index = array.findIndex((d) => d.uuid === afterUuid);
    if (index < 0) {
      console.warn(
        `Redux: Could not find data with uuid ${afterUuid} to insert new value after it`
      );
    }
    array.splice(index + 1, 0, value);
  } else {
    array.push(value);
  }
}
