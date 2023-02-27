import { bitsToFlags } from "@systemic-games/pixels-core-utils";
import {
  RemoteActionType,
  ActionType,
  AnimationType,
  BatteryStateFlagsValues,
  ConditionType,
  ConditionTypeValues,
  ConnectionStateFlagsValues,
  EditAction,
  EditActionMakeWebRequest,
  EditActionPlayAnimation,
  EditActionPlayAudioClip,
  EditCondition,
  EditConditionBatteryState,
  EditConditionConnectionState,
  EditConditionFaceCompare,
  EditConditionHelloGoodbye,
  FaceCompareFlagsValues,
  HelloGoodbyeFlagsValues,
  getActionTypeDisplayName,
  getAnimationTypeDisplayName,
  getConditionTypeDisplayName,
} from "@systemic-games/pixels-edit-animation";

export function getActionTitle(
  actionType: ActionType,
  actionRemoteType: RemoteActionType = 0
): string {
  const title = getActionTypeDisplayName(actionType, actionRemoteType)?.name;
  if (!title) {
    throw new Error(`getActionTitle(): unsupported action type: ${actionType}`);
  }
  return title;
}

function getDomain(url: string) {
  const parts = url.split("/");
  if (parts.length <= 1) {
    return url;
  } else {
    const addr = parts.find((s) => s.includes("."));
    return addr ? addr : url;
  }
}

export function getActionDescription(action: EditAction): string {
  if (action instanceof EditActionPlayAnimation) {
    const name = action.animation?.name;
    return name ? `Play ${name}` : "No Animation Selected";
  } else if (action instanceof EditActionPlayAudioClip) {
    const name = action.clip?.name;
    return name ? `Play ${name}` : "No Audio Clip Selected";
  } else if (action instanceof EditActionMakeWebRequest) {
    const url = action.url;
    return url ? `Make Web Request at ${getDomain(url)}` : "No URL Entered";
  }
  throw new Error(
    `getActionDescription(): unsupported action type: ${action.type}`
  );
}

/**
 * Return the animation type title based on the animation type.
 * @param animation The editAnimation to check type and return title.
 * @returns a string representing the animation type title.
 */
export function getAnimationTitle(animationType: AnimationType): string {
  const title = getAnimationTypeDisplayName(animationType)?.name;
  if (!title) {
    throw new Error(
      `getAnimationTitle(): unsupported animation type: ${animationType}`
    );
  }
  return title;
}

export function getConditionTitle(actionType: ConditionType): string {
  const title = getConditionTypeDisplayName(actionType)?.name;
  return title ?? "No action selected";
}

export function getConditionDescription(condition: EditCondition): string {
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
