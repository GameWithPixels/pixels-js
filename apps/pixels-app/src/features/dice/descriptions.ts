import { assertNever } from "@systemic-games/pixels-core-utils";
import {
  PixelColorway,
  PixelDieType,
  PixelInfo,
  PixelRollState,
  PixelStatus,
} from "@systemic-games/react-native-pixels-connect";

import { listToText } from "~/features/utils";

export function getDieTypeLabel(dieType: PixelDieType): string {
  switch (dieType) {
    case "unknown":
      return "";
    case "d4":
      return "D4";
    case "d6":
      return "D6";
    case "d6pipped":
      return "Pipped D6";
    case "d6fudge":
      return "Fudge D6";
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
      assertNever(dieType, `Unsupported die type: ${dieType}`);
  }
}

export function getColorwayLabel(colorway: PixelColorway): string {
  switch (colorway) {
    case "unknown":
      return "";
    case "onyxBlack":
      return "Onyx Black";
    case "hematiteGrey":
      return "Hematite Grey";
    case "midnightGalaxy":
      return "Midnight Galaxy";
    case "auroraSky":
      return "Aurora Sky";
    case "clear":
      return "Clear";
    case "whiteAurora":
      return "White Aurora";
    case "custom":
      return "Custom";
    default:
      assertNever(colorway, `Unsupported colorway: ${colorway}`);
  }
}

export function getDieTypeAndColorwayLabel({
  dieType,
  colorway,
}: Pick<PixelInfo, "dieType" | "colorway">): string {
  const dieTypeLabel = getDieTypeLabel(dieType);
  const colorwayLabel = getColorwayLabel(colorway);
  return colorwayLabel.length
    ? `${dieTypeLabel}, ${colorwayLabel}`
    : dieTypeLabel;
}

export function getFacesAsText(faces: number[]): string {
  if (!faces.length) {
    return "(no face selected)";
  } else if (faces.length === 1) {
    return String(faces[0]);
  } else {
    const sorted = [...faces].sort((a, b) => a - b).reverse();
    if (
      sorted.length > 2 &&
      sorted.every((v, i) => i === 0 || v + 1 === sorted[i - 1])
    ) {
      return `${sorted[sorted.length - 1]} to ${sorted[0]}`;
    } else {
      return listToText(sorted.map(String));
    }
  }
}

export function getPixelStatusLabel(status?: PixelStatus): string {
  switch (status) {
    case undefined:
    case "disconnected":
      return "Disconnected";
    case "connecting":
    case "identifying":
      return "Connecting...";
    case "ready":
      return "Connected";
    case "disconnecting":
      return "Disconnecting...";
    default:
      assertNever(status);
  }
}

export function getRollStateLabel(state?: PixelRollState): string {
  switch (state) {
    case undefined:
    case "unknown":
      return "";
    case "rolled":
      return "Rolled";
    case "handling":
    case "rolling":
      return "Rolling";
    case "crooked":
      return "Crooked";
    case "onFace":
      return "On Face";
    default:
      assertNever(state);
  }
}

export function getRollStateAndFaceLabel(
  state?: PixelRollState,
  face?: number
): string | undefined {
  return face !== undefined && state && state !== "unknown"
    ? state === "rolled"
      ? `Rolled a ${face}`
      : state === "onFace"
        ? `On face ${face}`
        : state === "rolling" || state === "handling"
          ? "Rolling..."
          : getRollStateLabel(state)
    : undefined;
}
