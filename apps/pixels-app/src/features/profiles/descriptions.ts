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
  } else if (flagName === "done") {
    return "Finished Charging";
  } else if (flagName === "low") {
    return "Low Battery";
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
      return "Audio Clip";
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
      return "Play an audio clip on your device";
    case "makeWebRequest":
      return "Send a web request through your device";
    case "speakText":
      return "Speak a text on your device";
    default:
      assertNever(type);
  }
}

export function getProfileDieTypeLabel(dieType: PixelDieType): string {
  switch (dieType) {
    case "unknown":
      return "";
    case "d4":
      return "D4";
    case "d6":
    case "d6pipped":
    case "d6fudge":
      return "D6 / Pipped D6"; // Fudge D6
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

export function getColorOverrideLabel(
  colorOverrideType:
    | Profiles.NormalsColorOverrideType
    | Profiles.NoiseColorOverrideType
): string {
  switch (colorOverrideType) {
    case "none":
      return "";
    case "randomFromGradient":
      return "Color is randomly selected from the gradient";
    case "faceToGradient":
      return "Color is selected in the gradient based on face up";
    case "faceToRainbowWheel":
      return "Color depends on face up";
    default:
      assertNever(colorOverrideType);
  }
}

export function getWebRequestFormatLabel(
  format: Profiles.WebRequestFormat
): string {
  switch (format) {
    case "parameters":
      return "Parameters";
    case "json":
      return "JSON";
    case "discord":
      return "Discord";
    default:
      assertNever(format, `Unsupported WebRequest format: ${format}`);
  }
}
