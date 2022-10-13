/**
 * Base class for throwing assertion errors.
 */
export class AssertionError extends Error {}

/**
 * A typical assert function with an optional message.
 */
export default function (condition: unknown, msg?: string): asserts condition {
  if (!condition) {
    throw new AssertionError(msg ?? "Assert failed");
  }
}
