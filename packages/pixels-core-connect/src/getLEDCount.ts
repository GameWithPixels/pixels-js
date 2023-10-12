import { assertNever } from "@systemic-games/pixels-core-utils";

import { PixelDieType } from "./Messages";

export function getLEDCount(dieType: PixelDieType): number {
  switch (dieType) {
    case "unknown":
      return 0;
    case "d4":
    case "d6":
    case "d6fudge":
      return 6;
    case "d6pipped":
      return 21;
    case "d8":
      return 8;
    case "d10":
    case "d00":
      return 10;
    case "d12":
      return 12;
    case "d20":
      return 20;
    default:
      assertNever(dieType);
  }
}
