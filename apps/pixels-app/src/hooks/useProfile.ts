import { assert } from "@systemic-games/pixels-core-utils";

import { Action, ConditionType, PixelProfile } from "@/temp";

export function useProfile(
  profileOrUuid: PixelProfile | string,
  profiles?: PixelProfile[]
): {
  name: string;
  description: string;
  group: string;
  favorite: boolean;
  getOrAddRule: (conditionType: ConditionType) => number;
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
    getOrAddRule: (conditionType: ConditionType) => {
      const index = profile.rules.findIndex(
        (r) => r.condition.type === conditionType
      );
      if (index >= 0) {
        return index;
      }
      profile.rules.push({
        condition: { type: conditionType },
        actions: [new Action("playAnimation")],
      });
      return profile.rules.length - 1;
    },
  };
}
