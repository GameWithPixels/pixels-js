import {
  ConditionType,
  ConditionTypeValues,
} from "@systemic-games/pixels-edit-animation";

export default function (actionType: ConditionType): string {
  switch (actionType) {
    case ConditionTypeValues.handling:
      return "Pixel is picked up";
    case ConditionTypeValues.batteryState:
      return "Battery Event...";
    case ConditionTypeValues.connectionState:
      return "Bluetooth Event...";
    case ConditionTypeValues.crooked:
      return "Pixel is crooked";
    case ConditionTypeValues.faceCompare:
      return "Pixel roll is...";
    case ConditionTypeValues.helloGoodbye:
      return "Pixel wakes up / sleeps";
    case ConditionTypeValues.idle:
      return "Pixel is idle for...";
    case ConditionTypeValues.rolling:
      return "Pixel is rolling";
    default:
      return "No action selected";
  }
}
