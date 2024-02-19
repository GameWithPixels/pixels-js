import { PixelDieType } from "./PixelDieType";
import { Vec3 } from "./Vec3";

const twentySidedNormals = [
  { xTimes1000: -335, yTimes1000: 937, zTimes1000: -92 },
  { xTimes1000: -352, yTimes1000: -930, zTimes1000: -98 },
  { xTimes1000: 716, yTimes1000: 572, zTimes1000: -399 },
  { xTimes1000: -253, yTimes1000: -357, zTimes1000: 898 },
  { xTimes1000: -995, yTimes1000: 8, zTimes1000: 93 },
  { xTimes1000: 804, yTimes1000: -9, zTimes1000: 593 },
  { xTimes1000: -396, yTimes1000: 583, zTimes1000: -708 },
  { xTimes1000: 705, yTimes1000: -582, zTimes1000: -403 },
  { xTimes1000: 407, yTimes1000: 571, zTimes1000: 712 },
  { xTimes1000: 246, yTimes1000: -355, zTimes1000: -901 },
  { xTimes1000: -246, yTimes1000: 355, zTimes1000: 901 },
  { xTimes1000: -407, yTimes1000: -571, zTimes1000: -712 },
  { xTimes1000: -705, yTimes1000: 582, zTimes1000: 403 },
  { xTimes1000: 396, yTimes1000: -583, zTimes1000: 708 },
  { xTimes1000: -804, yTimes1000: 9, zTimes1000: -593 },
  { xTimes1000: 995, yTimes1000: -8, zTimes1000: -93 },
  { xTimes1000: 253, yTimes1000: 357, zTimes1000: -898 },
  { xTimes1000: -716, yTimes1000: -572, zTimes1000: 399 },
  { xTimes1000: 352, yTimes1000: 930, zTimes1000: 98 },
  { xTimes1000: 335, yTimes1000: -937, zTimes1000: 92 },
] as const;

const twelveSidedNormals = [
  { xTimes1000: -446, yTimes1000: 850, zTimes1000: -276 }, // 1
  { xTimes1000: -447, yTimes1000: 525, zTimes1000: 723 }, // 2
  { xTimes1000: -447, yTimes1000: -850, zTimes1000: -276 }, // 3
  { xTimes1000: -1000, yTimes1000: 0, zTimes1000: -0 }, // 4
  { xTimes1000: 447, yTimes1000: 525, zTimes1000: -723 }, // 5
  { xTimes1000: -447, yTimes1000: 0, zTimes1000: -894 }, // 6
  { xTimes1000: 447, yTimes1000: -0, zTimes1000: 894 }, // 7
  { xTimes1000: -447, yTimes1000: -525, zTimes1000: 723 }, // 8
  { xTimes1000: 1000, yTimes1000: -0, zTimes1000: 0 }, // 9
  { xTimes1000: 447, yTimes1000: 850, zTimes1000: 276 }, // 10
  { xTimes1000: 447, yTimes1000: -525, zTimes1000: -723 }, // 11
  { xTimes1000: 446, yTimes1000: -850, zTimes1000: 276 }, // 12
] as const;

const tenSidedNormals = [
  { xTimes1000: -65, yTimes1000: 996, zTimes1000: 55 }, // 00
  { xTimes1000: 165, yTimes1000: -617, zTimes1000: 768 }, // 10
  { xTimes1000: 489, yTimes1000: -8, zTimes1000: -871 }, // 20
  { xTimes1000: -993, yTimes1000: 17, zTimes1000: 111 }, // ...
  { xTimes1000: 650, yTimes1000: 603, zTimes1000: 461 },
  { xTimes1000: -650, yTimes1000: -603, zTimes1000: -461 },
  { xTimes1000: 993, yTimes1000: -17, zTimes1000: -111 },
  { xTimes1000: -489, yTimes1000: 8, zTimes1000: 871 },
  { xTimes1000: -165, yTimes1000: 617, zTimes1000: -768 },
  { xTimes1000: 65, yTimes1000: -996, zTimes1000: -55 },
] as const;

const eightSidedNormals = [
  { xTimes1000: -921, yTimes1000: -198, zTimes1000: -333 }, // 1
  { xTimes1000: 288, yTimes1000: 897, zTimes1000: -333 }, // 2
  { xTimes1000: -0, yTimes1000: 0, zTimes1000: -1000 }, // 3
  { xTimes1000: -633, yTimes1000: 698, zTimes1000: 333 }, // ...
  { xTimes1000: 633, yTimes1000: -698, zTimes1000: -333 },
  { xTimes1000: 0, yTimes1000: -0, zTimes1000: 1000 },
  { xTimes1000: -288, yTimes1000: -897, zTimes1000: 333 },
  { xTimes1000: 921, yTimes1000: 198, zTimes1000: 333 },
] as const;

const sixSidedNormals = [
  { xTimes1000: -1000, yTimes1000: 0, zTimes1000: 0 },
  { xTimes1000: 0, yTimes1000: 1000, zTimes1000: 0 },
  { xTimes1000: 0, yTimes1000: 0, zTimes1000: 1000 },
  { xTimes1000: 0, yTimes1000: 0, zTimes1000: -1000 },
  { xTimes1000: 0, yTimes1000: -1000, zTimes1000: 0 },
  { xTimes1000: 1000, yTimes1000: 0, zTimes1000: 0 },
] as const;

export function getBaseNormals(
  dieType: PixelDieType
): readonly Readonly<Vec3>[] {
  switch (dieType) {
    case "d20":
      return twentySidedNormals;
    case "d12":
      return twelveSidedNormals;
    case "d10":
    case "d00":
      return tenSidedNormals;
    case "d8":
      return eightSidedNormals;
    default:
      return sixSidedNormals;
  }
}
