import {
  BatteryStateFlagsValues,
  ConditionTypeValues,
  ConnectionStateFlagsValues,
  EditCondition,
  EditConditionBatteryState,
  EditConditionConnectionState,
  EditConditionFaceCompare,
  EditConditionHelloGoodbye,
  FaceCompareFlagsValues,
  HelloGoodbyeFlagsValues,
} from "@systemic-games/pixels-edit-animation";
import { bitsToFlags } from "@systemic-games/react-native-pixels-components";

export default function (condition?: EditCondition): string {
  let conditionTitle: string = "";
  let faceCompareFlag: number[];
  let batteryFlags: number[];
  let helloGoodbyeFlags: number[];
  let connectionStateFlags: number[];
  if (condition) {
    switch (condition.type) {
      case ConditionTypeValues.handling:
        conditionTitle = "die is picked up";
        break;
      case ConditionTypeValues.batteryState:
        batteryFlags = bitsToFlags(
          (condition as EditConditionBatteryState).flags
        );

        conditionTitle =
          "Battery is " +
          batteryFlags
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
                  conditionTitle = "No conditions";
                  break;
              }
            })
            .join(" or ");

        break;
      case ConditionTypeValues.connectionState:
        connectionStateFlags = bitsToFlags(
          (condition as EditConditionConnectionState).flags
        );

        conditionTitle =
          " Die is " +
          connectionStateFlags.map((flag) => {
            switch (flag) {
              case ConnectionStateFlagsValues.connected:
                return "connected";
              case ConnectionStateFlagsValues.disconnected:
                return "disconnected";
              default:
                conditionTitle = "No conditions";
                break;
            }
          });

        break;
      case ConditionTypeValues.crooked:
        conditionTitle = "die is crooked";

        break;
      case ConditionTypeValues.faceCompare:
        {
          const face = (condition as EditConditionFaceCompare).faceIndex + 1;

          faceCompareFlag = bitsToFlags(
            (condition as EditConditionFaceCompare).flags
          );

          conditionTitle =
            "Die roll is " +
            faceCompareFlag
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
            face;
        }

        break;
      case ConditionTypeValues.helloGoodbye:
        helloGoodbyeFlags = bitsToFlags(
          (condition as EditConditionHelloGoodbye).flags
        );

        conditionTitle =
          "Die is " +
          helloGoodbyeFlags
            .map((flag) => {
              switch (flag) {
                case HelloGoodbyeFlagsValues.goodbye:
                  return "going to sleep";
                case HelloGoodbyeFlagsValues.hello:
                  return "waking up";
                default:
                  conditionTitle = "No conditions";
                  break;
              }
            })
            .join(" or ");
        break;
      case ConditionTypeValues.idle:
        conditionTitle = "Die is idle";

        break;
      case ConditionTypeValues.rolling:
        conditionTitle = "Die is rolling";

        break;
      case ConditionTypeValues.unknown:
        conditionTitle = "Unknown";

        break;
      default:
        conditionTitle = "No condition selected";
        break;
    }
  }

  return conditionTitle;
}
