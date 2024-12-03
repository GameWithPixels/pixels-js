import {
  Profiles,
  Serializable,
} from "@systemic-games/react-native-pixels-connect";
import { reaction, runInAction } from "mobx";
import React from "react";

import { useAppStore } from "~/app/hooks";
import { AppStore } from "~/app/store";
import {
  ObservableObjectStore,
  Library,
  readCompositeProfile,
} from "~/features/store";
import { logError } from "~/features/utils";

// TODO slightly modified copy of useEditableProfile.ts

export const EditableCompositeProfileStore =
  ObservableObjectStore<Profiles.CompositeProfile>;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type EditableCompositeProfileStore = InstanceType<
  typeof EditableCompositeProfileStore
>;

export const EditableCompositeProfileStoreGetterContext = React.createContext({
  getEditableCompositeProfileStore(
    _profileUuid: string
  ): EditableCompositeProfileStore {
    throw new Error("Using default EditableCompositeProfileStoreGetterContext");
  },
});

export function useEditableCompositeProfileStore(
  profileUuid: string
): EditableCompositeProfileStore {
  const editableCompositeProfileStore = React.useContext(
    EditableCompositeProfileStoreGetterContext
  ).getEditableCompositeProfileStore(profileUuid);
  React.useEffect(
    () => editableCompositeProfileStore.take(),
    [editableCompositeProfileStore]
  );
  return editableCompositeProfileStore;
}

// Returns an observable profile that is editable
export function useEditableCompositeProfile(
  profileUuid: string
): Profiles.CompositeProfile {
  return useEditableCompositeProfileStore(profileUuid).getOrCreate();
}

export function useIsEditableCompositeProfileModified(
  profileUuid: string
): boolean {
  const editableCompositeProfileStore =
    useEditableCompositeProfileStore(profileUuid);
  const [modified, setModified] = React.useState(
    editableCompositeProfileStore.version > 0
  );
  React.useEffect(
    () =>
      reaction(
        () => editableCompositeProfileStore.version,
        (v) => setModified(v > 0)
      ),
    [editableCompositeProfileStore.version]
  );
  return modified;
}

export function useCommitEditableCompositeProfile(
  profileUuid: string
): (sourceUuid?: string) => void {
  const store = useAppStore();
  const profileStore = useEditableCompositeProfileStore(profileUuid);
  return React.useCallback(
    (sourceUuid?: string) => {
      const profile = profileStore.object;
      if (profile && profileStore.version) {
        commitEditableCompositeProfile(profile, store, sourceUuid);
        profileStore.resetVersion();
      } else if (profile) {
        console.log("Skipping saving unmodified composite profile");
      } else {
        logError("No editable composite profile to save");
      }
    },
    [profileStore, store]
  );
}

// EditableCompositeProfileStore version is not reset! See useCommitEditableCompositeProfile().
export function commitEditableCompositeProfile(
  profile: Profiles.CompositeProfile,
  store: AppStore,
  sourceUuid?: string
): void {
  // Store profile
  runInAction(() => (profile.lastModified = new Date()));
  sourceUuid ??=
    store.getState().library.profiles.entities[profile.uuid]?.sourceUuid;
  const profileData = Serializable.fromCompositeProfile(profile);
  store.dispatch(Library.CompositeProfiles.update(profileData));
  // Update non editable instance of the profile
  readCompositeProfile(profile.uuid, store.getState().library);
}
