import { Profiles } from "@systemic-games/react-native-pixels-connect";

export function rolledConditionComparator(
  r1: Profiles.Rule,
  r2: Profiles.Rule
): number {
  const faces1 = (r1.condition as Profiles.ConditionRolled).faces;
  const faces2 = (r2.condition as Profiles.ConditionRolled).faces;
  return (
    (faces2 ? Math.max(...faces2) : 0) - (faces1 ? Math.max(...faces1) : 0)
  );
}
