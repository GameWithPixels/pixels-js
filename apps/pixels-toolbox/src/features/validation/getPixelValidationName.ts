import { assertNever } from "@systemic-games/pixels-core-utils";
import {
  PixelDieType,
  PixelInfo,
} from "@systemic-games/react-native-pixels-connect";

function dieTypeStr(dieType: PixelDieType): string {
  switch (dieType) {
    case "unknown":
      return "";
    case "d4":
      return "D4";
    case "d6":
      return "D6";
    case "d6fudge":
      return "Fudge";
    case "d6pipped":
      return "Pipped";
    case "d8":
      return "D8";
    case "d10":
      return "D10";
    case "d00":
      return "D00";
    case "d12":
      return "D12";
    case "d20":
      return "D20";
    default:
      assertNever(dieType);
  }
}

export function getPixelValidationName({
  dieType,
}: Pick<PixelInfo, "dieType">): string {
  return `Pixels ${dieTypeStr(dieType)}`;
}
