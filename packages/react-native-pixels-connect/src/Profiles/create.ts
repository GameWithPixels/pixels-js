import { assert, assertNever } from "@systemic-games/pixels-core-utils";

import * as Profiles from "./Profiles";

export function createCondition(
  type: Profiles.ConditionType
): Profiles.Condition {
  switch (type) {
    case "none":
      assert(false, "Cannot create a condition of type 'none'");
      break;
    case "helloGoodbye":
      return new Profiles.ConditionHelloGoodbye();
    case "handling":
      return new Profiles.ConditionHandling();
    case "rolling":
      return new Profiles.ConditionRolling();
    case "rolled":
      return new Profiles.ConditionRolled();
    case "crooked":
      return new Profiles.ConditionCrooked();
    case "idle":
      return new Profiles.ConditionIdle();
    case "connection":
      return new Profiles.ConditionConnection();
    case "battery":
      return new Profiles.ConditionBattery();
    default:
      assertNever(type);
  }
}

export function createAction(type: Profiles.ActionType): Profiles.Action {
  switch (type) {
    case "playAnimation":
      return new Profiles.ActionPlayAnimation();
    case "playAudioClip":
      return new Profiles.ActionPlayAudioClip();
    case "makeWebRequest":
      return new Profiles.ActionMakeWebRequest();
    case "speakText":
      return new Profiles.ActionSpeakText();
    default:
      throw new Error(`Unsupported action type: ${type}`);
  }
}
