import { assertNever, range } from "@systemic-games/pixels-core-utils";

import { PixelDieType } from "./Messages";

export function getDieFaces(dieType: PixelDieType): number[] {
  switch (dieType) {
    case "unknown":
      return [];
    case "d4":
      return range(1, 5);
    case "d6":
    case "d6pipped":
    case "d6fudge":
      return range(1, 7);
    case "d8":
      return range(1, 9);
    case "d10":
      return range(0, 10);
    case "d00":
      return range(0, 100, 10);
    case "d12":
      return range(1, 13);
    case "d20":
      return range(1, 21);
    default:
      assertNever(dieType);
  }
}
