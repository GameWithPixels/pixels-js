import {
  assert,
  assertNever,
  combineFlags,
  keysToValues,
} from "@systemic-games/pixels-core-utils";
import {
  BatteryStateFlagsValues,
  ConnectionStateFlagsValues,
  FaceCompareFlagsValues,
  HelloGoodbyeFlagsValues,
  Serializable,
} from "@systemic-games/pixels-edit-animation";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { runInAction } from "mobx";

import { readAnimation } from "./animations";
import { readAudioClip } from "./audioClips";
import { LibraryState } from "./profilesLibrarySlice";
import { storeLog } from "./storeLog";

import { makeObservable } from "~/features/makeObservable";

const loadedProfiles = new Map<string, Profiles.Profile>();

export function create(uuid: string, skipAdd: boolean): Profiles.Profile {
  storeLog("create", "profile", uuid); // `rules: ${profile?.rules.map((r) => `${r.condition.type}=>${r.actions.length}`)}`
  const profile = makeObservable(new Profiles.Profile({ uuid }));
  if (!skipAdd) {
    loadedProfiles.set(uuid, profile);
  }
  return profile;
}

export function readProfile(
  uuid: string,
  library: LibraryState,
  newInstance = false
): Profiles.Profile {
  const profile = newInstance
    ? create(uuid, newInstance)
    : loadedProfiles.get(uuid) ?? create(uuid, newInstance);
  runInAction(() => updateProfile(profile, library));
  return profile;
}

function updateProfile(profile: Profiles.Profile, library: LibraryState): void {
  const profileData = library.profiles.find((p) => p.uuid === profile.uuid);
  assert(profileData, `Profile ${profile.uuid} not found`);
  profile.name = profileData.name;
  profile.description = profileData.description;
  profile.group = profileData.group;
  profile.favorite = profileData.favorite;
  // Update rules
  const rulesCount = profileData.rules.length;
  profile.rules.length = rulesCount;
  for (let i = 0; i < rulesCount; ++i) {
    let rule = profile.rules[i];
    const ruleData = profileData.rules[i];
    // Update condition
    const conditionType = ruleData.condition.type;
    if (rule?.condition?.type !== conditionType) {
      const cond = Profiles.createCondition(conditionType);
      if (!rule) {
        rule = new Profiles.Rule(cond);
        profile.rules[i] = rule;
      } else {
        rule.condition = cond;
      }
    }
    updateCondition(rule.condition, ruleData.condition, profileData.conditions);
    // Update actions
    const actionsCount = ruleData.actions.length;
    rule.actions.length = actionsCount;
    for (let j = 0; j < actionsCount; ++j) {
      const actionType = ruleData.actions[j].type;
      if (rule.actions[j]?.type !== actionType) {
        rule.actions[j] = Profiles.createAction(actionType);
      }
      updateAction(
        rule.actions[j],
        ruleData.actions[j],
        profileData.actions,
        library
      );
    }
  }
}

function updateCondition(
  condition: Profiles.Condition,
  { type, index }: Serializable.RuleData["condition"],
  conditionSetData: Serializable.ConditionSetData
) {
  switch (type) {
    case "helloGoodbye":
      {
        const cond = condition as Profiles.ConditionHelloGoodbye;
        const data = conditionSetData[type][index];
        cond.flags = combineFlags(
          keysToValues(data.flags, HelloGoodbyeFlagsValues)
        );
      }
      break;
    case "handling":
      break;
    case "rolling":
      {
        const cond = condition as Profiles.ConditionRolling;
        const data = conditionSetData[type][index];
        cond.recheckAfter = data.recheckAfter;
      }
      break;
    case "rolled":
      {
        const cond = condition as Profiles.ConditionRolled;
        const data = conditionSetData[type][index];
        cond.flags = combineFlags(
          keysToValues(data.flags, FaceCompareFlagsValues)
        );
        cond.face = data.face;
      }
      break;
    case "crooked":
      break;
    case "connection":
      {
        const cond = condition as Profiles.ConditionConnection;
        const data = conditionSetData[type][index];
        cond.flags = combineFlags(
          keysToValues(data.flags, ConnectionStateFlagsValues)
        );
      }
      break;
    case "battery":
      {
        const cond = condition as Profiles.ConditionBattery;
        const data = conditionSetData[type][index];
        cond.flags = combineFlags(
          keysToValues(data.flags, BatteryStateFlagsValues)
        );
        cond.recheckAfter = data.recheckAfter;
      }
      break;
    case "idle":
      {
        const cond = condition as Profiles.ConditionIdle;
        const data = conditionSetData[type][index];
        cond.period = data.period;
      }
      break;
    default:
      assertNever(type, `Unsupported condition type: ${type}`);
  }
}

function updateAction(
  action: Profiles.Action,
  { type, index }: Serializable.RuleData["actions"][number],
  actionSetData: Serializable.ActionSetData,
  library: LibraryState
) {
  switch (type) {
    case "playAnimation":
      {
        const act = action as Profiles.ActionPlayAnimation;
        const data = actionSetData[type][index];
        act.animation = data.animationUuid
          ? readAnimation(data.animationUuid, library)
          : undefined;
        act.face = data.face;
        act.loopCount = data.loopCount;
      }
      break;
    case "playAudioClip":
      {
        const act = action as Profiles.ActionPlayAudioClip;
        const data = actionSetData[type][index];
        act.clip = data.clipUuid
          ? readAudioClip(data.clipUuid, library)
          : undefined;
      }
      break;
    case "makeWebRequest":
      {
        const act = action as Profiles.ActionMakeWebRequest;
        const data = actionSetData[type][index];
        act.url = data.url;
        act.value = data.value;
      }
      break;
    default:
      assertNever(type, `Unsupported action type: ${type}`);
  }
}
