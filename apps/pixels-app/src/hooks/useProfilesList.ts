import {
  Profiles,
  Serializable,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { Library } from "~/features/store";
import { readProfile } from "~/features/store/profiles";

// Returns a list of observable profiles from Redux store
export function useProfilesList(): Readonly<Profiles.Profile>[] {
  const library = useAppSelector((state) => state.library);
  return React.useMemo(
    () =>
      library.profiles.ids.map((uuid) => readProfile(uuid as string, library)),
    [library]
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
