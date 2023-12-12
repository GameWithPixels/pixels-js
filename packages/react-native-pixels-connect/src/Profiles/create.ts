import { assert, assertNever } from "@systemic-games/pixels-core-utils";

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
  rolled: Profiles.RolledFlags;
  crooked: undefined;
  idle: undefined;
  connection: Profiles.ConnectionFlags;
  battery: Profiles.BatteryFlags;
}

export function createCondition<K extends string & keyof CreateConditionFlags>(
  type: K,
  flagName?: CreateConditionFlags[K]
): Profiles.Condition {
  switch (type) {
    case "none":
      assert(false, "Cannot create a condition of type 'none'");
      break;
    case "helloGoodbye":
      return new Profiles.ConditionHelloGoodbye({
        flags: getFlag(flagName, Profiles.HelloGoodbyeFlagsValues),
      });
    case "handling":
      return new Profiles.ConditionHandling();
    case "rolling":
      return new Profiles.ConditionRolling();
    case "rolled":
      return new Profiles.ConditionRolled({
        flags: getFlag(flagName, Profiles.RolledFlagsValues),
      });
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
