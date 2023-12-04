import { Condition, ConditionType } from "@systemic-games/pixels-core-connect";

export function useCondition(condition: Condition): {
  type: ConditionType;
} {
  return {
    type: condition.type,
  };
}
