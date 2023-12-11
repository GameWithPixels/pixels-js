import { assertNever } from "@systemic-games/pixels-core-utils";

import { ActionType } from "./ActionType";
import { ConditionType } from "./ConditionType";
import { RemoteActionType } from "./RemoteActionType";
import { AnimationType } from "../animations/AnimationType";

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
    case "none":
      return;
    case "simple":
      return { name: "Simple Flashes", order: 0 };
    case "rainbow":
      return { name: "Colorful Rainbow", order: 1 };
    case "keyframed":
      return { name: "Colored Design", order: 3 };
    case "gradientPattern":
      return { name: "Mixed Design", order: 4 };
    case "gradient":
      return { name: "Simple Gradient", order: 2 };
    case "noise":
      return { name: "Noise", order: 5 };
    case "cycle":
    case "name":
      throw new Error(
        `getAnimationTypeDisplayName: unsupported animation type: ${animType}`
      );
    default:
      assertNever(animType, `Unknown animation type: ${animType}`);
  }
}

/**
 * @category Profile
 */
export function getActionTypeDisplayName(
  actionType: ActionType,
  actionRemoteType: RemoteActionType = "none"
): NameAndOrder | undefined {
  switch (actionType) {
    case "none":
    case "playAudioClip":
    case "speakText":
    case "makeWebRequest":
      return;
    case "playAnimation":
      return { name: "Trigger Pattern", order: 0 };
    case "runOnDevice":
      switch (actionRemoteType) {
        case "none":
          return;
        case "playAudioClip":
          return { name: "Play Audio Clip", order: 1 };
        case "makeWebRequest":
          return { name: "Make Web Request", order: 2 };
        default:
          assertNever(
            actionRemoteType,
            `Unknown action remote type: ${actionRemoteType}`
          );
      }
      break;
    default:
      assertNever(actionType, `Unknown action type: ${actionType}`);
  }
}

/**
 * @category Profile
 */
export function getConditionTypeDisplayName(
  conditionType: ConditionType
): NameAndOrder | undefined {
  switch (conditionType) {
    case "none":
      return;
    case "helloGoodbye":
      return { name: "Pixel wakes up / sleeps", order: 0 };
    case "handling":
      return { name: "Pixel is picked up", order: 1 };
    case "rolling":
      return { name: "Pixel is rolling", order: 2 };
    case "rolled":
      return { name: "Pixel roll is...", order: 3 };
    case "crooked":
      return { name: "Pixel is crooked", order: 4 };
    case "connection":
      return { name: "Bluetooth Event...", order: 5 };
    case "battery":
      return { name: "Battery Event...", order: 6 };
    case "idle":
      return { name: "Pixel is idle for...", order: 7 };
    default:
      assertNever(conditionType, `Unknown condition type: ${conditionType}`);
  }
}
