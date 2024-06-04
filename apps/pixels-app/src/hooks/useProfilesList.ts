import {
  Profiles,
  Serializable,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { Library } from "~/features/store";
import { readProfile } from "~/features/store/profiles";

// Returns a list of observable profiles from Redux store
// Dice custom profiles are excluded
export function useProfilesList(): Readonly<Profiles.Profile>[] {
  const library = useAppSelector((state) => state.library);
  const paired = useAppSelector((state) => state.pairedDice.paired);
  const unpaired = useAppSelector((state) => state.pairedDice.unpaired);
  return React.useMemo(() => {
    const customProfiles = paired
      .map((d) => d.profileUuid)
      .concat(unpaired.map((p) => p.profileUuid));
    return library.profiles.ids
      .map((uuid) => readProfile(uuid as string, library))
      .filter((p) => !customProfiles.includes(p.uuid));
  }, [library, paired, unpaired]);
}

export function useEditProfilesList(): {
  addProfile: (profile: Profiles.Profile) => void;
  removeProfile: (profileUuid: string) => void;
} {
  const appDispatch = useAppDispatch();
  return React.useMemo(
    () => ({
      addProfile: (profile: Profiles.Profile) =>
        // Note: no need to re-compute hash with overrides when adding a new profile
        appDispatch(Library.Profiles.add(Serializable.fromProfile(profile))),
      removeProfile: (profileUuid: string) =>
        appDispatch(Library.Profiles.remove(profileUuid)),
    }),
    [appDispatch]
  );
}
