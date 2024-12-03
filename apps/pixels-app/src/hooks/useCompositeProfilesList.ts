import {
  Profiles,
  Serializable,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { useAppSelector, useAppStore } from "~/app/hooks";
import { Library, readCompositeProfile } from "~/features/store";

// Returns a list of observable composite profiles from Redux store
export function useCompositeProfilesList(): Readonly<Profiles.CompositeProfile>[] {
  const library = useAppSelector((state) => state.library);
  return React.useMemo(
    () =>
      library.compositeProfiles.ids.map((uuid) =>
        readCompositeProfile(uuid as string, library)
      ),
    [library]
  );
}

export function useEditCompositeProfilesList(): {
  addProfile: (profile: Profiles.CompositeProfile) => void;
  removeProfile: (profileUuid: string) => void;
} {
  const store = useAppStore();
  return React.useMemo(
    () => ({
      addProfile: (profile: Profiles.CompositeProfile) =>
        store.dispatch(
          Library.CompositeProfiles.add({
            ...Serializable.fromCompositeProfile(profile),
          })
        ),
      removeProfile: (profileUuid: string) =>
        store.dispatch(Library.CompositeProfiles.remove(profileUuid)),
    }),
    [store]
  );
}
