import { assertNever } from "@systemic-games/pixels-core-utils";

import * as Profiles from "./Profiles";

function getFlag(
  flagName: string | undefined,
  flags: Record<string, number>
): number | undefined {
  return flagName ? flags[flagName] : undefined;
}

export interface CreateConditionFlags {
  none: undefined;
  helloGoodbye: Profiles.HelloGoodbyeFlags;
  handling: undefined;
  rolling: undefined;
  faceCompare: Profiles.FaceCompareFlags;
  crooked: undefined;
  idle: undefined;
  connection: Profiles.ConnectionFlags;
  battery: Profiles.BatteryFlags;
  rolled: undefined;
}

export function createCondition<K extends string & keyof CreateConditionFlags>(
  type: K,
  flagName?: CreateConditionFlags[K]
): Profiles.Condition {
  switch (type) {
    case "none":
      throw new Error("Cannot create a condition of type 'none'");
    case "helloGoodbye":
      return new Profiles.ConditionHelloGoodbye({
        flags: getFlag(flagName, Profiles.HelloGoodbyeFlagsValues),
      });
    case "handling":
      return new Profiles.ConditionHandling();
    case "rolling":
      return new Profiles.ConditionRolling();
    case "faceCompare":
      throw new Error("Condition of type 'faceCompare' is deprecated");
    case "crooked":
      return new Profiles.ConditionCrooked();
    case "idle":
      return new Profiles.ConditionIdle();
    case "connection":
      return new Profiles.ConditionConnection({
        flags: getFlag(flagName, Profiles.ConnectionFlagsValues),
      });
    case "battery":
      return new Profiles.ConditionBattery({
        flags: getFlag(flagName, Profiles.BatteryFlagsValues),
      });
    case "rolled":
      return new Profiles.ConditionRolled();
    default:
      assertNever(type, `Unsupported condition type: ${type}`);
  }
}

export function createAction(type: Profiles.ActionType): Profiles.Action {
  switch (type) {
    case "none":
      throw new Error("Cannot create an action of type 'none'");
    case "playAnimation":
      return new Profiles.ActionPlayAnimation();
    case "playAudioClip":
      return new Profiles.ActionPlayAudioClip();
    case "makeWebRequest":
      return new Profiles.ActionMakeWebRequest();
    case "speakText":
      return new Profiles.ActionSpeakText();
    default:
      assertNever(type, `Unsupported action type: ${type}`);
  }
}

export function createCompositeCondition(
  type: Profiles.CompositeConditionType | "rolled"
): Profiles.CompositeRule["condition"] {
  switch (type) {
    case "none":
      throw new Error("Cannot create a composite condition of type 'none'");
    case "rolled":
      return new Profiles.ConditionRolled();
    case "result":
      return new Profiles.CompositeConditionResult();
    case "rollTag":
      return new Profiles.CompositeConditionRollTag();
    default:
      assertNever(type, `Unsupported composite condition type: ${type}`);
  }
}

export function createCompositeAction(
  type: Profiles.CompositeActionType | Profiles.ActionType
): Profiles.CompositeRule["actions"][number] {
  switch (type) {
    case "none":
      throw new Error("Cannot create a composite action of type 'none'");
    case "playAnimation":
    case "playAudioClip":
    case "makeWebRequest":
    case "speakText":
      return createAction(type);
    case "playMcpAnimation":
      return new Profiles.CompositeActionPlayMcpAnimation();
    default:
      assertNever(type, `Unsupported composite action type: ${type}`);
  }
}
