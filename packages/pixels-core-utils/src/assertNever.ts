import assert from "./assert";

export default function (x: never, message: string): never {
  assert(false, message ?? "assertNever error");
}
