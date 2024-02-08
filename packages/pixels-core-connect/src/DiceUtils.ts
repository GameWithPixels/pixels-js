import { PixelDieType } from "@systemic-games/pixels-core-animation";
import { assertNever, range } from "@systemic-games/pixels-core-utils";

export const DiceUtils = {
  getLEDCount(dieType: PixelDieType): number {
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
  },

  // DieType must start by a letter followed by the number of faces
  getFaceCount(dieType: PixelDieType): number {
    if (!dieType || dieType.length < 2 || dieType[0] !== "d") {
      return 0;
    } else if (dieType === "d00") {
      return 10;
    } else {
      let i = 1;
      while (i < dieType.length) {
        const c = dieType.charAt(i);
        if (c < "0" || c > "9") break;
        ++i;
      }
      return Number(dieType.substring(1, i));
    }
  },

  getTopFace(dieType: PixelDieType): number {
    return dieType === "d00" || dieType === "d10"
      ? 0
      : DiceUtils.getFaceCount(dieType);
  },

  // Try to get die type from number of LEDs
  estimateDieType(ledCount: number): PixelDieType {
    // For now we infer the die type from the number of LEDs, but eventually
    // that value will be part of identification data.
    switch (ledCount) {
      case 4:
        return "d4";
      case 6:
        return "d6";
      case 8:
        return "d8";
      case 10:
        return "d10";
      case 12:
        return "d12";
      case 20:
        return "d20";
      case 21:
        return "d6pipped";
      default:
        return "unknown";
    }
  },

  // TODO fix for D4 rolling as D6 and D00 rolling as D10
  faceFromIndex(faceIndex: number, dieType: PixelDieType): number {
    switch (dieType) {
      case "d4":
        if (faceIndex === 2) return 2;
        if (faceIndex === 3) return 3;
        if (faceIndex === 5) return 4;
        return 1;
      case "d10":
        return faceIndex;
      case "d00":
        return faceIndex * 10;
      default:
        return faceIndex + 1;
    }
  },

  // TODO fix for D4 rolling as D6 and D00 rolling as D10
  indexFromFace(face: number, dieType: PixelDieType): number {
    switch (dieType) {
      case "d4":
        if (face === 2) return 2;
        if (face === 3) return 3;
        if (face === 4) return 5;
        return 0;
      case "d10":
        return face;
      case "d00":
        return Math.floor(face / 10);
      default:
        return face - 1;
    }
  },

  getDieFaces(dieType: PixelDieType): number[] {
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
  },

  // TODO fix for edit animations taking a face value instead of an index
  mapFaceForAnimation(face: number, dieType: PixelDieType): number {
    return 1 + DiceUtils.indexFromFace(face, dieType);
  },
} as const;
