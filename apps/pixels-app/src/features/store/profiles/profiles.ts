import {
  assertNever,
  combineFlags,
  keysToValues,
} from "@systemic-games/pixels-core-utils";
import {
  Color,
  Profiles,
  Serializable,
} from "@systemic-games/react-native-pixels-connect";
import { runInAction } from "mobx";

import { readAnimation } from "./animations";
import { readAudioClip } from "./audioClips";
import { log } from "./log";

import { LibraryState } from "~/app/store";
import { logError, makeObservable } from "~/features/utils";

const loadedProfiles = new Map<string, Profiles.Profile>();

function create(uuid: string, skipAdd: boolean): Profiles.Profile {
  log("create", "profile", uuid);
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
  const profileData = library.profiles.entities[uuid];
  if (!profileData) {
    logError(
      `Profile ${uuid} not found in library [${JSON.stringify(
        uuid // Got some Sentry report about this being an object rather than a string
      )}]`
    );
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
  profile: Profiles.Profile,
  profileData: Serializable.ProfileData,
  library: LibraryState
): void {
  profile.name = profileData.name;
  profile.description = profileData.description;
  profile.dieType = profileData.dieType;
  profile.colorway = profileData.colorway;
  profile.brightness = profileData.brightness;
  if (profile.creationDate.getTime() !== profileData.creationDate) {
    profile.creationDate = new Date(profileData.creationDate);
  }
  if (profile.lastModified.getTime() !== profileData.lastChanged) {
    profile.lastModified = new Date(profileData.lastChanged);
  }
  if (profile.lastUsed?.getTime() !== profileData.lastUsed) {
    profile.lastUsed = profileData.lastUsed
      ? new Date(profileData.lastUsed)
      : undefined;
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
      const cond = Profiles.createCondition(conditionType);
      if (!rule) {
        rule = makeObservable(new Profiles.Rule(cond));
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
        rule.actions[j] = makeObservable(Profiles.createAction(actionType));
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
): void {
  switch (type) {
    case "helloGoodbye":
      if (condition instanceof Profiles.ConditionHelloGoodbye) {
        const data = conditionSetData[type][index];
        condition.flags = combineFlags(
          keysToValues(data.flags, Profiles.HelloGoodbyeFlagsValues)
        );
      }
      break;
    case "handling":
      break;
    case "rolling":
      if (condition instanceof Profiles.ConditionRolling) {
        const data = conditionSetData[type][index];
        condition.recheckAfter = data.recheckAfter;
      }
      break;
    case "rolled":
      if (condition instanceof Profiles.ConditionRolled) {
        const data = conditionSetData[type][index];
        const facesCount = data.faces.length;
        condition.faces.length = facesCount;
        for (let j = 0; j < facesCount; ++j) {
          condition.faces[j] = data.faces[j];
        }
      }
      break;
    case "crooked":
      break;
    case "connection":
      if (condition instanceof Profiles.ConditionConnection) {
        const data = conditionSetData[type][index];
        condition.flags = combineFlags(
          keysToValues(data.flags, Profiles.ConnectionFlagsValues)
        );
      }
      break;
    case "battery":
      if (condition instanceof Profiles.ConditionBattery) {
        const data = conditionSetData[type][index];
        condition.flags = combineFlags(
          keysToValues(data.flags, Profiles.BatteryFlagsValues)
        );
        condition.recheckAfter = data.recheckAfter;
      }
      break;
    case "idle":
      if (condition instanceof Profiles.ConditionIdle) {
        const data = conditionSetData[type][index];
        condition.period = data.period;
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
): void {
  switch (type) {
    case "playAnimation":
      if (action instanceof Profiles.ActionPlayAnimation) {
        const data = actionSetData[type][index];
        action.animation = data.animationUuid
          ? readAnimation(data.animationUuid, library)
          : undefined;
        action.face = data.face;
        action.loopCount = data.loopCount;
        action.duration = data.duration;
        action.fade = data.fade;
        action.intensity = data.intensity;
        const colorsCount = data.colors.length;
        action.colors.length = colorsCount;
        for (let i = 0; i < colorsCount; ++i) {
          const newColor = new Color(data.colors[i]);
          if (!action.colors[i]?.equals(newColor)) {
            action.colors[i] = newColor;
          }
        }
      }
      break;
    case "playAudioClip":
      if (action instanceof Profiles.ActionPlayAudioClip) {
        const data = actionSetData[type][index];
        action.clip = data.clipUuid
          ? readAudioClip(data.clipUuid, library)
          : undefined;
      }
      break;
    case "makeWebRequest":
      if (action instanceof Profiles.ActionMakeWebRequest) {
        const data = actionSetData[type][index];
        action.url = data.url;
        action.value = data.value;
        action.format = data.format;
      }
      break;
    case "speakText":
      if (action instanceof Profiles.ActionSpeakText) {
        const data = actionSetData[type][index];
        action.text = data.text;
        action.pitch = data.pitch;
        action.rate = data.rate;
      }
      break;
    default:
      assertNever(type, `Unsupported action type: ${type}`);
  }
}
