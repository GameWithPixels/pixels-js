import { assert, assertNever } from "@systemic-games/pixels-core-utils";
import {
  Profiles,
  Serializable,
} from "@systemic-games/react-native-pixels-connect";
import { runInAction } from "mobx";

import { log } from "./log";
import {
  updateConditionRolled,
  updateAction as updateProfileAction,
} from "./profiles";

import { LibraryState } from "~/app/store";
import { logError, makeObservable } from "~/features/utils";

const loadedProfiles = new Map<string, Profiles.CompositeProfile>();

function create(uuid: string, skipAdd: boolean): Profiles.CompositeProfile {
  log("create", "compositeProfile", uuid);
  const profile = makeObservable(new Profiles.CompositeProfile({ uuid }));
  if (!skipAdd) {
    loadedProfiles.set(uuid, profile);
  }
  return profile;
}

export function readCompositeProfile(
  uuid: string,
  library: LibraryState,
  newInstance = false
): Profiles.CompositeProfile {
  const profileData = library.compositeProfiles.entities[uuid];
  if (!profileData) {
    logError(`Composite profile ${uuid} not found in library`);
  }
  //assert(profileData, `Profile ${uuid} not found in library`);
  const existing = !newInstance && loadedProfiles.get(uuid);
  const profile = existing ? existing : create(uuid, newInstance);
  if (profileData) {
    runInAction(() => updateProfile(profile, profileData, library));
  }
  return profile;
}

function updateProfile(
  profile: Profiles.CompositeProfile,
  profileData: Serializable.CompositeProfileData,
  library: LibraryState
): void {
  assert(
    profile.uuid === profileData.uuid,
    `Profile UUID mismatch on updating composite profile data, expected value is ${profile.uuid} but got ${profileData.uuid}`
  );
  profile.name = profileData.name;
  profile.description = profileData.description;
  profile.formula = profileData.formula;
  if (profile.creationDate.getTime() !== profileData.creationDate) {
    profile.creationDate = new Date(profileData.creationDate);
  }
  if (profile.lastModified.getTime() !== profileData.lastModified) {
    profile.lastModified = new Date(profileData.lastModified);
  }
  // Update rules
  const rulesCount = profileData.rules.length;
  profile.rules.length = rulesCount;
  for (let i = 0; i < rulesCount; ++i) {
    let rule = profile.rules[i];
    const ruleData = profileData.rules[i];
    // Update condition
    const conditionType = ruleData.condition.type;
    if (rule?.condition?.type !== conditionType) {
      const cond = Profiles.createCompositeCondition(conditionType);
      if (!rule) {
        rule = makeObservable(new Profiles.CompositeRule(cond));
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
        rule.actions[j] = makeObservable(
          Profiles.createCompositeAction(actionType)
        );
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
  condition: Profiles.CompositeRule["condition"],
  { type, index }: Serializable.CompositeRuleData["condition"],
  conditionSetData: Serializable.CompositeConditionSetData
): void {
  switch (type) {
    case "rolled":
      if (condition instanceof Profiles.ConditionRolled) {
        updateConditionRolled(conditionSetData[type][index], condition);
      }
      break;
    case "result":
      if (condition instanceof Profiles.CompositeConditionResult) {
        const data = conditionSetData[type][index];
        condition.value = data.value;
      }
      break;
    case "rollTag":
      if (condition instanceof Profiles.CompositeConditionRollTag) {
        const data = conditionSetData[type][index];
        condition.tag = data.tag;
      }
      break;
    default:
      assertNever(type, `Unsupported condition type: ${type}`);
  }
}

function updateAction(
  action: Profiles.CompositeRule["actions"][number],
  { type, index }: Serializable.CompositeRuleData["actions"][number],
  actionSetData: Serializable.CompositeActionSetData,
  library: LibraryState
): void {
  switch (type) {
    case "playAnimation":
    case "playAudioClip":
    case "makeWebRequest":
    case "speakText":
      if (action instanceof Profiles.Action) {
        updateProfileAction(action, { type, index }, actionSetData, library);
      }
      break;
    case "playMcpAnimation":
      if (action instanceof Profiles.CompositeActionPlayMcpAnimation) {
        const data = actionSetData[type][index];
        action.animation = data.animation;
      }
      break;
    default:
      assertNever(type, `Unsupported action type: ${type}`);
  }
}
