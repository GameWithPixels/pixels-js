/**
 * The base struct for all conditions, stores a type identifier so we can tell the actual
 * type of the condition and fetch the condition parameters correctly.
 * @category Profile Condition
 */
export default interface Condition {
  /** See {@link ConditionTypeValues} for possible values. */
  type: number;
}
