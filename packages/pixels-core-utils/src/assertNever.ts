import { assert } from "./assert";

/**
 * Use this function to raise an error when running a branch of code
 * that is not reachable according to typescript.
 * Typically you may call this function in the default statement of a
 * switch() that has case statements for all possible values.
 * @param x A value of type never.
 * @param message The error message if this function is called.
 */
export function assertNever(x: never, message?: string): never {
  assert(false, message ?? "assertNever error");
}
