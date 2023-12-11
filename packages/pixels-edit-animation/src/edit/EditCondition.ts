import {
  DataSet,
  ConditionType,
  Condition,
} from "@systemic-games/pixels-core-animation";
import { getValueKeyName } from "@systemic-games/pixels-core-utils";

import EditDataSet from "./EditDataSet";

export default abstract class EditCondition {
  abstract readonly type: ConditionType;
  abstract toCondition(editSet: EditDataSet, set: DataSet): Condition;
  abstract duplicate(): EditCondition;

  get flagName(): string | undefined {
    return undefined;
  }

  protected getFlagName<KeyValuesType extends { [key: string]: number }>(
    flags: number,
    values: KeyValuesType
  ): keyof KeyValuesType | undefined {
    if (!flags) {
      return undefined;
    }
    const value = getValueKeyName(flags, values);
    if (value) {
      return value;
    }
    // Support legacy case with multiple bits set to 1
    let i = 1;
    flags |= 0; // Turn to 32 bit range
    while (!(i & flags) && i <= flags) {
      i = i << 1;
    }
    if (i <= flags) {
      return getValueKeyName(i, values);
    }
  }
}
