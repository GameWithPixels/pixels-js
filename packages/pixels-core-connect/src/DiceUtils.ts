import { PixelDieType } from "./Messages";

export const DiceUtils = {
  // DieType must start by a letter followed by the number of faces
  getFaceCount(dieType: PixelDieType): number {
    if (!dieType || dieType.length < 2 || dieType[0] !== "d") {
      return 0;
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

  faceFromIndex(faceIndex: number, ledCount: number): number {
    return faceIndex + (ledCount === 10 ? 0 : 1);
  },
} as const;
