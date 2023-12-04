import { Action, ActionType } from "~/temp";

export function useAction(action: Action): {
  type: ActionType;
} {
  return {
    type: action.type,
  };
}
