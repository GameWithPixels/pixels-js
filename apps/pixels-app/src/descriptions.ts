import { assertNever } from "@systemic-games/pixels-core-utils";

import { ActionType, ConditionType } from "@/temp";

export function getConditionTypeLabel(type: ConditionType): string {
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
    case "bluetoothEvent":
      return "Bluetooth Notifications";
    case "batteryEvent":
      return "Battery Notifications";
    case "idle":
      return "When Die is Idle";
    default:
      assertNever(type);
  }
}

export function getConditionTypeDescription(type: ConditionType): string {
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
    case "bluetoothEvent":
      return "on Bluetooth event";
    case "batteryEvent":
      return "on battery state event";
    case "idle":
      return "when die is idle";
    default:
      assertNever(type);
  }
}

export function getActionTypeLabel(type: ActionType): string {
  switch (type) {
    case "none":
      return "";
    case "playAnimation":
      return "Animation";
    case "playSound":
      return "Sound";
    case "textToSpeech":
      return "Speak";
    case "webRequest":
      return "Web Request";
    default:
      assertNever(type);
  }
}

export function getActionTypeDescription(type: ActionType): string {
  switch (type) {
    case "none":
      return "";
    case "playAnimation":
      return "Play an animation on the Pixel LEDs";
    case "playSound":
      return "Play a sound file on your phone";
    case "textToSpeech":
      return "Speak a text on your phone";
    case "webRequest":
      return "Send a web request";
    default:
      assertNever(type);
  }
}
