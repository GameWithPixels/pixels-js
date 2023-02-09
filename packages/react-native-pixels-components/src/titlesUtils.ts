import {
  ActionTypeValues,
  AnimationType,
  AnimationTypeValues,
  BatteryStateFlagsValues,
  ConditionType,
  ConditionTypeValues,
  ConnectionStateFlagsValues,
  EditAction,
  EditActionPlayAnimation,
  EditActionPlayAudioClip,
  EditCondition,
  EditConditionBatteryState,
  EditConditionConnectionState,
  EditConditionFaceCompare,
  EditConditionHelloGoodbye,
  FaceCompareFlagsValues,
  HelloGoodbyeFlagsValues,
} from "@systemic-games/pixels-edit-animation";

import { bitsToFlags } from "./bitMasksUtils";

export function getActionTitles(actions: EditAction[]): string[] {
  const actionsTitles: any[] = [];

  actions.forEach(function (action) {
    if (action.type === ActionTypeValues.playAnimation) {
      actionsTitles.push(
        "Play " + (action as EditActionPlayAnimation).animation?.name
      );
    } else {
      actionsTitles.push(
        "Play " + (action as EditActionPlayAudioClip).clip?.name
      );
    }
  });
  return actionsTitles;
}

/**
 * Return the animation type title based on the animation type.
 * @param animation The editAnimation to check type and return title.
 * @returns a string representing the animation type title.
 */
export function getAnimationTitle(animationType?: AnimationType): string {
  switch (animationType) {
    case AnimationTypeValues.simple:
      return "Simple Flashes";
    case AnimationTypeValues.rainbow:
      return "Colorful Rainbow";
    case AnimationTypeValues.gradient:
      return "Simple Gradient";
    case AnimationTypeValues.gradientPattern:
      return "Gradient LED Pattern";
    case AnimationTypeValues.keyframed:
      return "Color LED Pattern";
    case AnimationTypeValues.noise:
      return "Noise";
    default:
      return "Type";
  }
}

export function getConditionSimpleTitle(actionType: ConditionType): string {
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

export function getConditionTitle(condition: EditCondition): string {
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
