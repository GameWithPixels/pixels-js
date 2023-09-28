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
export function assert(condition: unknown, msg?: string): asserts condition {
  if (!condition) {
    throw new AssertionError(msg ?? "Assert failed");
  }
}
