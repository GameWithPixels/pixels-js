import { assertNever } from "@systemic-games/pixels-core-utils";
import {
  PixelColorway,
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
      return "FD6";
    case "d6pipped":
      return "PD6";
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

function colorwayInitials(colorway: PixelColorway): string {
  switch (colorway) {
    case "unknown":
    case "custom":
      return "";
    case "onyxBlack":
      return "OB";
    case "hematiteGrey":
      return "HG";
    case "midnightGalaxy":
      return "MG";
    case "auroraSky":
      return "AS";
    case "clear":
      return "CL";
    default:
      assertNever(colorway);
  }
}

export function getDefaultName({
  dieType,
  colorway,
}: Pick<PixelInfo, "dieType" | "colorway">): string {
  let name = `Pixels ${dieTypeStr(dieType)}`;
  const initials = colorwayInitials(colorway);
  if (initials.length > 0) {
    name += ` ${initials}`;
  }
  return name;
}
