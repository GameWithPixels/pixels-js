import {
  AnimationType,
  AnimationTypeValues,
} from "../animations/AnimationType";
import { ActionType, ActionTypeValues } from "./ActionType";
import { ConditionType, ConditionTypeValues } from "./ConditionType";
import { RemoteActionType, RemoteActionTypeValues } from "./RemoteActionType";

/**
 * @category Profile
 */
export interface NameAndOrder {
  name: string;
  order: number;
}

/**
 * @category Profile
 */
export function getAnimationTypeDisplayName(
  animType: AnimationType
): NameAndOrder | undefined {
  switch (animType) {
    case AnimationTypeValues.none:
      return;
    case AnimationTypeValues.simple:
      return { name: "Simple Flashes", order: 0 };
    case AnimationTypeValues.rainbow:
      return { name: "Colorful Rainbow", order: 1 };
    case AnimationTypeValues.keyframed:
      return { name: "Color LED Pattern", order: 3 };
    case AnimationTypeValues.gradientPattern:
      return { name: "Gradient LED Pattern", order: 4 };
    case AnimationTypeValues.gradient:
      return { name: "Simple Gradient", order: 2 };
    case AnimationTypeValues.noise:
      return { name: "Noise", order: 5 };
  }
}

/**
 * @category Profile
 */
export function getActionTypeDisplayName(
  actionType: ActionType,
  actionRemoteType: RemoteActionType = 0
): NameAndOrder | undefined {
  switch (actionType) {
    case ActionTypeValues.none:
      return;
    case ActionTypeValues.playAnimation:
      return { name: "Trigger Pattern", order: 0 };
    case ActionTypeValues.runOnDevice:
      switch (actionRemoteType) {
        case RemoteActionTypeValues.playAudioClip:
          return { name: "Play Audio Clip", order: 1 };
        case RemoteActionTypeValues.makeWebRequest:
          return { name: "Make Web Request", order: 2 };
      }
  }
}

/**
 * @category Profile
 */
export function getConditionTypeDisplayName(
  conditionType: ConditionType
): NameAndOrder | undefined {
  switch (conditionType) {
    case ConditionTypeValues.none:
      return;
    case ConditionTypeValues.helloGoodbye:
      return { name: "Pixel wakes up / sleeps", order: 0 };
    case ConditionTypeValues.handling:
      return { name: "Pixel is picked up", order: 1 };
    case ConditionTypeValues.rolling:
      return { name: "Pixel is rolling", order: 2 };
    case ConditionTypeValues.faceCompare:
      return { name: "Pixel roll is...", order: 3 };
    case ConditionTypeValues.crooked:
      return { name: "Pixel is crooked", order: 4 };
    case ConditionTypeValues.connectionState:
      return { name: "Bluetooth Event...", order: 5 };
    case ConditionTypeValues.batteryState:
      return { name: "Battery Event...", order: 6 };
    case ConditionTypeValues.idle:
      return { name: "Pixel is idle for...", order: 7 };
  }
}
