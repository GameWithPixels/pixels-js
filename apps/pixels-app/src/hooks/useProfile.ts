import { assert } from "@systemic-games/pixels-core-utils";
import { Profiles } from "@systemic-games/react-native-pixels-connect";

export function useProfile(
  profileOrUuid: Profiles.Profile | string,
  profiles?: Profiles.Profile[]
): {
  name: string;
  description: string;
  group: string;
  favorite: boolean;
  getOrAddRule: (conditionType: Profiles.ConditionType) => number;
} {
  const profile =
    typeof profileOrUuid === "string"
      ? profiles?.find((p) => p.uuid === profileOrUuid)
      : profileOrUuid;
  assert(profile, `Profile ${profileOrUuid} not found`);
  return {
    name: profile.name,
    description: profile.description,
    group: profile.group,
    favorite: profile.favorite,
    getOrAddRule: (conditionType: Profiles.ConditionType) => {
      const index = profile.rules.findIndex(
        (r) => r.condition.type === conditionType
      );
      if (index >= 0) {
        return index;
      }
      profile.rules.push(
        new Profiles.Rule(Profiles.createCondition(conditionType), {
          actions: [Profiles.createAction("playAnimation")],
        })
      );
      return profile.rules.length - 1;
    },
  };
}
