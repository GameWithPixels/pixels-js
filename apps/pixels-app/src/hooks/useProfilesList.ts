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
  const customProfiles = React.useMemo(
    () =>
      paired
        .map((p) => p.die.profileUuid)
        .concat(unpaired.map((p) => p.profileUuid)),
    [paired, unpaired]
  );
  return React.useMemo(
    () =>
      library.profiles.ids
        .map((uuid) => readProfile(uuid as string, library))
        .filter((p) => !customProfiles.includes(p.uuid)),
    [customProfiles, library]
  );
}

export function useEditProfilesList(): {
  addProfile: (profile: Profiles.Profile) => void;
  removeProfile: (profileUuid: string) => void;
} {
  const appDispatch = useAppDispatch();
  const add = (profile: Profiles.Profile) =>
    appDispatch(Library.Profiles.add(Serializable.fromProfile(profile)));
  const remove = (profileUuid: string) =>
    appDispatch(Library.Profiles.remove(profileUuid));
  return {
    addProfile: add,
    removeProfile: remove,
  };
}
