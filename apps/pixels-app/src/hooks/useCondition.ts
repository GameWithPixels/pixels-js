import { Profiles } from "@systemic-games/react-native-pixels-connect";

export function useCondition(condition: Profiles.Condition): {
  type: Profiles.ConditionType;
} {
  return {
    type: condition.type,
  };
}
