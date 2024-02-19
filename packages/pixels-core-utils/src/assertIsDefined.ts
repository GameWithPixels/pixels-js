import { AssertionError } from "./assert";

/**
 * A typical assert function for Typescript that throws if the given value undefined or null.
 * @param value The value to check.
 */
export function assertIsDefined<T>(value: T): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new AssertionError(`Assertion failed on nullable value "${value}"`);
  }
}
