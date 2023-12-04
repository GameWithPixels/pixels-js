import { Condition, ConditionType } from "~/temp";

export function useCondition(condition: Condition): {
  type: ConditionType;
} {
  return {
    type: condition.type,
  };
}
