import { assertNever } from "@systemic-games/pixels-core-utils";

export const DieTypes = ["d4", "d6", "pd6", "d8", "d10", "d12", "d20"] as const;
export type DieType = typeof DieTypes[number];

export function getLedCount(dieType: DieType) {
  switch (dieType) {
    case "d4":
      return 4;
    case "d6":
      return 6;
    case "pd6":
      return 6;
    case "d8":
      return 8;
    case "d10":
      return 10;
    case "d12":
      return 12;
    case "d20":
      return 20;
    default:
      assertNever(dieType);
  }
}
