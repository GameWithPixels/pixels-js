import { Profiles } from "@systemic-games/react-native-pixels-connect";

export function useAction(action: Profiles.Action): {
  type: Profiles.ActionType;
} {
  return {
    type: action.type,
  };
}
