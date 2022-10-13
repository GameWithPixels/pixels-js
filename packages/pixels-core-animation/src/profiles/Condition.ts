import { ConditionType } from "./ConditionType";

/// <summary>
/// The base struct for all conditions, stores a type identifier so we can tell the actual
/// type of the condition and fetch the condition parameters correctly.
/// </summary>
export default interface Condition {
  type: ConditionType;
}
