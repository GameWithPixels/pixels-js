import { assertNever } from "@systemic-games/pixels-core-utils";

export const DieTypes = ["d4", "d6", "pd6", "d8", "d10", "d12", "d20"] as const;
export type DieType = (typeof DieTypes)[number];

export function getLEDCount(dieType: DieType): number {
  switch (dieType) {
    case "d4":
      return 4;
    case "d6":
      return 6;
    case "pd6":
      return 21;
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

export function getDieType(ledCount: number): DieType {
  switch (ledCount) {
    case 4:
      return "d4";
    case 6:
      return "d6";
    case 21:
      return "pd6";
    case 8:
      return "d8";
    case 10:
      return "d10";
    case 12:
      return "d12";
    case 20:
      return "d20";
    default:
      throw new Error(`Unsupported LED count: ${ledCount}`);
  }
}
