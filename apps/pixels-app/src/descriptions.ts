import { assertNever } from "@systemic-games/pixels-core-utils";
import {
  PixelColorway,
  PixelDieType,
  PixelInfo,
  PixelRollState,
  PixelStatus,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";

export function getConditionTypeLabel(type: Profiles.ConditionType): string {
  switch (type) {
    case "none":
      return "";
    case "helloGoodbye":
      return "When Die Turns On";
    case "handling":
      return "When Die is Picked Up";
    case "rolling":
      return "When Die is Rolling";
    case "faceCompare":
    case "rolled":
      return "When Die is Rolled";
    case "crooked":
      return "When Die is Crooked";
    case "connection":
      return "Bluetooth Notifications";
    case "battery":
      return "Battery Notifications";
    case "idle":
      return "When Die is Idle";
    default:
      assertNever(type);
  }
}

export function getConditionTypeDescription(
  type: Profiles.ConditionType
): string {
  switch (type) {
    case "none":
      return "";
    case "helloGoodbye":
      return "when die wakes up";
    case "handling":
      return "when die is picked up";
    case "rolling":
      return "when die is rolling";
    case "faceCompare":
    case "rolled":
      return "when die has rolled";
    case "crooked":
      return "when die is crooked";
    case "connection":
      return "on Bluetooth event";
    case "battery":
      return "on battery state event";
    case "idle":
      return "when die is idle";
    default:
      assertNever(type);
  }
}

export function getConditionFlagLabel(flagName: string): string {
  const l = flagName?.length;
  if (!l) {
    return "";
  } else if (flagName === "hello") {
    return "When Die Turns On";
  } else if (l === 1) {
    return flagName.toUpperCase();
  } else if (flagName === "badCharging") {
    return "Bad Charging";
  } else {
    return flagName.charAt(0).toUpperCase() + flagName.slice(1);
  }
}

export function getActionTypeLabel(type: Profiles.ActionType): string {
  switch (type) {
    case "none":
      return "";
    case "playAnimation":
      return "Animation";
    case "playAudioClip":
      return "Sound";
    case "makeWebRequest":
      return "Web Request";
    case "speakText":
      return "Speak";
    default:
      assertNever(type);
  }
}

export function getActionTypeDescription(type: Profiles.ActionType): string {
  switch (type) {
    case "none":
      return "";
    case "playAnimation":
      return "Play an animation on the Pixel LEDs";
    case "playAudioClip":
      return "Play a sound file on your phone";
    case "makeWebRequest":
      return "Send a web request";
    case "speakText":
      return "Speak a text on your phone";
    default:
      assertNever(type);
  }
}

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

export function getProfileDieTypeLabel(dieType: PixelDieType): string {
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
    case "d00":
      return "D10 / D00";
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
  if (faces.length <= 1) {
    return faces[0]?.toString() ?? "?";
  } else {
    const sorted = [...faces].sort((a, b) => a - b).reverse();
    const last = sorted.pop();
    return `${sorted.join(", ")} and ${last}`;
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
    case "onFace":
      return "On Face";
    case "handling":
      return "Handling";
    case "rolling":
      return "Rolling";
    case "crooked":
      return "Crooked";
    default:
      assertNever(state);
  }
}
