import { Profiles } from "@systemic-games/react-native-pixels-connect";

export const EditorActionTypes = Object.freeze(
  (Object.keys(Profiles.ActionTypeValues) as Profiles.ActionType[]).filter(
    (t) => t !== "none" && t !== "playAudioClip"
  )
);
