import { assert } from "@systemic-games/pixels-core-utils";

import { ActionType, ConditionType, PixelProfile } from "@/temp";

export function useRule(
  profileUuid: string,
  index: number,
  profiles: PixelProfile[]
): {
  condition: { type: ConditionType };
  actions: { type: ActionType }[];
} {
  const profile = profiles?.find((p) => p.uuid === profileUuid);
  assert(profile, `Profile ${profileUuid} not found`);
  const rule = profile.rules[index];
  assert(rule, `Rule at index ${index} not found`);
  return {
    condition: { type: rule.condition.type },
    actions: rule.actions.map((a) => ({ type: a.type })),
  };
}
