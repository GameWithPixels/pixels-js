import {
  Profiles,
  Serializable,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { useAppSelector, useAppStore } from "~/app/hooks";
import { computeProfileHashWithOverrides } from "~/features/profiles";
import { Library } from "~/features/store";
import { preSerializeProfile, readProfile } from "~/features/store/profiles";

// Returns a list of observable profiles from Redux store
// Dice custom profiles are excluded
export function useProfilesList(): {
  library: Readonly<Profiles.Profile>[];
  dice: Readonly<Profiles.Profile>[];
} {
  const library = useAppSelector((state) => state.library);
  const paired = useAppSelector((state) => state.pairedDice.paired);
  const unpaired = useAppSelector((state) => state.pairedDice.unpaired);
  return React.useMemo(() => {
    const diceProfiles = paired
      .map((d) => d.profileUuid)
      .concat(unpaired.map((p) => p.profileUuid));
    return {
      library: library.profiles.ids
        .map((uuid) => readProfile(uuid as string, library))
        .filter((p) => !diceProfiles.includes(p.uuid)),
      dice: diceProfiles.map((uuid) => readProfile(uuid, library)),
    };
  }, [library, paired, unpaired]);
}

export function useEditProfilesList(): {
  addProfile: (profile: Profiles.Profile) => void;
  removeProfile: (profileUuid: string) => void;
} {
  const store = useAppStore();
  return React.useMemo(
    () => ({
      addProfile: (profile: Profiles.Profile) => {
        // Use profile with pre-serialized data so the hash is stable
        profile = preSerializeProfile(profile, store.getState().library);
        return store.dispatch(
          Library.Profiles.add({
            ...Serializable.fromProfile(profile),
            hash: computeProfileHashWithOverrides(profile),
          })
        );
      },
      removeProfile: (profileUuid: string) =>
        store.dispatch(Library.Profiles.remove(profileUuid)),
    }),
    [store]
  );
}
