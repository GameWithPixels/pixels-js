import {
  BatteryStateFlagsValues,
  EditCondition,
  ConditionTypeValues,
  ConnectionStateFlagsValues,
  EditConditionBatteryState,
  EditConditionConnectionState,
  EditConditionFaceCompare,
  EditConditionHelloGoodbye,
  FaceCompareFlagsValues,
  HelloGoodbyeFlagsValues,
} from "@systemic-games/pixels-edit-animation";
import { bitsToFlags } from "@systemic-games/react-native-pixels-components";

export default function (condition: EditCondition): string {
  if (condition) {
    const type = condition.type;
    switch (type) {
      case ConditionTypeValues.handling:
        return "die is picked up";

      case ConditionTypeValues.batteryState:
        return (
          "Battery is " +
          bitsToFlags((condition as EditConditionBatteryState).flags)
            .map((flag) => {
              switch (flag) {
                case BatteryStateFlagsValues.ok:
                  return "ok";
                case BatteryStateFlagsValues.low:
                  return " low";
                case BatteryStateFlagsValues.charging:
                  return " charging";
                case BatteryStateFlagsValues.done:
                  return "done";
                default:
                  return "No condition";
              }
            })
            .join(" or ")
        );

      case ConditionTypeValues.connectionState:
        return (
          " Die is " +
          bitsToFlags((condition as EditConditionConnectionState).flags).map(
            (flag) => {
              switch (flag) {
                case ConnectionStateFlagsValues.connected:
                  return "connected";
                case ConnectionStateFlagsValues.disconnected:
                  return "disconnected";
                default:
                  return "No condition";
              }
            }
          )
        );

      case ConditionTypeValues.crooked:
        return "die is crooked";

      case ConditionTypeValues.faceCompare:
        return (
          "Die roll is " +
          bitsToFlags((condition as EditConditionFaceCompare).flags)
            .map((flag) => {
              switch (flag) {
                case FaceCompareFlagsValues.equal:
                  return "equal to";
                case FaceCompareFlagsValues.greater:
                  return "greater than";
                case FaceCompareFlagsValues.less:
                  return "less than";
                default:
                  throw new Error();
              }
            })
            .join(" or ") +
          " " +
          (condition as EditConditionFaceCompare).face
        );

      case ConditionTypeValues.helloGoodbye:
        return (
          "Die is " +
          bitsToFlags((condition as EditConditionHelloGoodbye).flags)
            .map((flag) => {
              switch (flag) {
                case HelloGoodbyeFlagsValues.goodbye:
                  return "going to sleep";
                case HelloGoodbyeFlagsValues.hello:
                  return "waking up";
                default:
                  return "No condition";
              }
            })
            .join(" or ")
        );

      case ConditionTypeValues.idle:
        return "Die is idle";

      case ConditionTypeValues.rolling:
        return "Die is rolling";
    }
  }
  return "No condition selected";
}
