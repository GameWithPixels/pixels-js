import { Action, ActionType } from "@systemic-games/pixels-core-connect";

export function useAction(action: Action): {
  type: ActionType;
} {
  return {
    type: action.type,
  };
}
