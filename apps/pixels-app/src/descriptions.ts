import { assertNever } from "@systemic-games/pixels-core-utils";
import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";

export function getConditionTypeLabel(type: Profiles.ConditionType): string {
  switch (type) {
    case "none":
      return "";
    case "helloGoodbye":
      return "Hello Notifications";
    case "handling":
      return "When Die is Picked Up";
    case "rolling":
      return "When Die is Rolling";
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
    case "unknown":
      return "";
    default:
      assertNever(dieType, `Unsupported die type: ${dieType}`);
  }
}
