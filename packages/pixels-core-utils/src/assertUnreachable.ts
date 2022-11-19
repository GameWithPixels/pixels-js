import assert from "./assert";

export default function (x: never): never {
  assert(false, "assertUnreachable failed");
}
