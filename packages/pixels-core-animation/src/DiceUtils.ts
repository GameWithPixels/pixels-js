import { assertNever, range } from "@systemic-games/pixels-core-utils";

import { PixelDieType } from "./PixelDieType";

function isFirmwareWithBadNormals(firmwareTimestamp?: number) {
  const FW_2023_11_17 = 1704150000000;
  return firmwareTimestamp && firmwareTimestamp <= FW_2023_11_17;
}

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

  getFaceCount(dieType: PixelDieType): number {
    switch (dieType) {
      case "unknown":
        return 0;
      case "d4":
        return 4;
      case "d6":
      case "d6fudge":
      case "d6pipped":
        return 6;
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

  getTopFace(dieType: PixelDieType): number {
    return dieType === "d10" || dieType === "d00"
      ? 0
      : DiceUtils.getFaceCount(dieType);
  },

  getBottomFace(dieType: PixelDieType): number {
    return dieType === "d10" ? 9 : dieType === "d00" ? 90 : 1;
  },

  // Try to derive the die type from number of LEDs
  estimateDieType(ledCount: number): PixelDieType {
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

  faceFromIndex(
    faceIndex: number,
    dieType: PixelDieType,
    firmwareTimestamp?: number
  ): number {
    if (isFirmwareWithBadNormals(firmwareTimestamp)) {
      // Account for bad normals in firmware 2023-11-17
      switch (dieType) {
        case "d4":
          if (faceIndex === 3) return 2;
          if (faceIndex === 2) return 3;
          if (faceIndex === 5) return 4;
          return 1;
        case "d6":
          if (faceIndex === 4) return 2;
          if (faceIndex === 3) return 3;
          if (faceIndex === 2) return 4;
          if (faceIndex === 1) return 5;
          return faceIndex + 1;
      }
    }
    switch (dieType) {
      case "d10":
        return faceIndex;
      case "d00":
        return faceIndex * 10;
      case "unknown":
        return faceIndex;
      default:
        return faceIndex + 1;
    }
  },

  indexFromFace(
    face: number,
    dieType: PixelDieType,
    firmwareTimestamp?: number
  ): number {
    if (isFirmwareWithBadNormals(firmwareTimestamp)) {
      // Account for bad normals in firmware 2023-11-17
      switch (dieType) {
        case "d4":
          if (face === 2) return 3;
          if (face === 3) return 2;
          if (face === 4) return 5;
          return 0;
        case "d6":
          if (face === 2) return 4;
          if (face === 3) return 3;
          if (face === 4) return 2;
          if (face === 5) return 1;
          return face - 1;
      }
    }
    switch (dieType) {
      case "d10":
        return face;
      case "d00":
        return Math.floor(face / 10);
      case "unknown":
        return face;
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
