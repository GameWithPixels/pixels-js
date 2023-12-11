import { assert } from "@systemic-games/pixels-core-utils";
import { Profiles } from "@systemic-games/react-native-pixels-connect";

export function useRule(
  profileUuid: string,
  index: number,
  profiles: Profiles.Profile[]
): {
  condition: Profiles.Condition;
  actions: Profiles.Action[];
} {
  const profile = profiles?.find((p) => p.uuid === profileUuid);
  assert(profile, `Profile ${profileUuid} not found`);
  const rule = profile.rules[index];
  assert(rule, `Rule at index ${index} not found`);
  return {
    condition: rule.condition,
    actions: rule.actions,
  };
}
