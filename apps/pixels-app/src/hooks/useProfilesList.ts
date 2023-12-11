import { Serializable } from "@systemic-games/pixels-edit-animation";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { readProfile } from "~/features/store/profiles";
import {
  addProfile,
  removeProfile,
} from "~/features/store/profilesLibrarySlice";

// Returns a list of observable profiles from Redux store
export function useProfilesList(): Readonly<Profiles.Profile>[] {
  const library = useAppSelector((state) => state.profilesLibrary);
  return React.useMemo(
    () => library.profiles.map((p) => readProfile(p.uuid, library)),
    [library]
  );
}

export function useEditProfilesList(): {
  addProfile: (profile: Profiles.Profile) => void;
  removeProfile: (profileUuid: string) => void;
} {
  const appDispatch = useAppDispatch();
  const add = (profile: Profiles.Profile) =>
    appDispatch(addProfile({ profile: Serializable.fromProfile(profile) }));
  const remove = (profileUuid: string) =>
    appDispatch(removeProfile(profileUuid));
  return {
    addProfile: add,
    removeProfile: remove,
  };
}
