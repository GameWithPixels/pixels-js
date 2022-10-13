import {
  AnimationType,
  AnimationTypeValues,
} from "../animations/AnimationType";
import { ActionType, ActionTypeValues } from "./ActionType";
import { ConditionType, ConditionTypeValues } from "./ConditionType";

export interface NameAndOrder {
  name: string;
  order: number;
}

export function getAnimationTypeDisplayName(
  animType: AnimationType
): NameAndOrder | undefined {
  switch (animType) {
    case AnimationTypeValues.Unknown:
      return;
    case AnimationTypeValues.Simple:
      return { name: "Simple Flashes", order: 0 };
    case AnimationTypeValues.Rainbow:
      return { name: "Colorful Rainbow", order: 1 };
    case AnimationTypeValues.Keyframed:
      return { name: "Color LED Pattern", order: 3 };
    case AnimationTypeValues.GradientPattern:
      return { name: "Gradient LED Pattern", order: 4 };
    case AnimationTypeValues.Gradient:
      return { name: "Simple Gradient", order: 2 };
    default:
      console.error(`Unknown value for AnimationType: ${animType}`);
      return;
  }
}

export function getActionTypeDisplayName(
  actionType: ActionType
): NameAndOrder | undefined {
  switch (actionType) {
    case ActionTypeValues.Unknown:
      return;
    case ActionTypeValues.PlayAnimation:
      return { name: "Trigger Pattern", order: 0 };
    case ActionTypeValues.PlayAudioClip:
      return { name: "Play Audio Clip", order: 1 };
    default:
      console.error(`Unknown value for ActionType: ${actionType}`);
      return;
  }
}

export function getConditionTypeDisplayName(
  conditionType: ConditionType
): NameAndOrder | undefined {
  switch (conditionType) {
    case ConditionTypeValues.Unknown:
      return;
    case ConditionTypeValues.HelloGoodbye:
      return { name: "Pixel wakes up / sleeps", order: 0 };
    case ConditionTypeValues.Handling:
      return { name: "Pixel is picked up", order: 1 };
    case ConditionTypeValues.Rolling:
      return { name: "Pixel is rolling", order: 2 };
    case ConditionTypeValues.FaceCompare:
      return { name: "Pixel roll is...", order: 3 };
    case ConditionTypeValues.Crooked:
      return { name: "Pixel is crooked", order: 4 };
    case ConditionTypeValues.ConnectionState:
      return { name: "Bluetooth Event...", order: 5 };
    case ConditionTypeValues.BatteryState:
      return { name: "Battery Event...", order: 6 };
    case ConditionTypeValues.Idle:
      return { name: "Pixel is idle for...", order: 7 };
    default:
      console.error(`Unknown value for ConditionType: ${conditionType}`);
      return;
  }
}
