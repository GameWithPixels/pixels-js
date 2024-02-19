/**
 * Base class for throwing assertion errors.
 */
export class AssertionError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "AssertionError";
  }
}

/**
 * A typical assert function for Typescript with an optional message.
 */
export function assert(value: unknown, msg?: string): asserts value {
  if (!value) {
    throw new AssertionError(msg ?? `Assertion failed with value ${value}`);
  }
}
