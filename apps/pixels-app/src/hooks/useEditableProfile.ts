import {
  Profiles,
  Serializable,
} from "@systemic-games/react-native-pixels-connect";
import { reaction, runInAction } from "mobx";
import React from "react";

import { useAppStore } from "~/app/hooks";
import { AppStore } from "~/app/store";
import { computeProfileHashWithOverrides } from "~/features/profiles";
import { ObservableObjectStore, Library, readProfile } from "~/features/store";
import { logError } from "~/features/utils";

export const EditableProfileStore = ObservableObjectStore<Profiles.Profile>;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type EditableProfileStore = InstanceType<typeof EditableProfileStore>;

export const EditableProfileStoreGetterContext = React.createContext({
  getEditableProfileStore(_profileUuid: string): EditableProfileStore {
    throw new Error("Using default EditableProfileStoreGetterContext");
  },
});

export function useEditableProfileStore(
  profileUuid: string
): EditableProfileStore {
  const editableProfileStore = React.useContext(
    EditableProfileStoreGetterContext
  ).getEditableProfileStore(profileUuid);
  React.useEffect(() => editableProfileStore.take(), [editableProfileStore]);
  return editableProfileStore;
}

// Returns an observable profile that is editable
export function useEditableProfile(profileUuid: string): Profiles.Profile {
  return useEditableProfileStore(profileUuid).getOrCreate();
}

export function useIsEditableProfileModified(profileUuid: string): boolean {
  const editableProfileStore = useEditableProfileStore(profileUuid);
  const [modified, setModified] = React.useState(
    editableProfileStore.version > 0
  );
  React.useEffect(
    () =>
      reaction(
        () => editableProfileStore.version,
        (v) => setModified(v > 0)
      ),
    [editableProfileStore.version]
  );
  return modified;
}

export function useCommitEditableProfile(
  profileUuid: string
): (sourceUuid?: string) => void {
  const store = useAppStore();
  const profileStore = useEditableProfileStore(profileUuid);
  return React.useCallback(
    (sourceUuid?: string) => {
      const profile = profileStore.object;
      if (profile && profileStore.version) {
        commitEditableProfile(profile, store, sourceUuid);
        profileStore.resetVersion();
      } else if (profile) {
        console.log("Skipping saving unmodified profile");
      } else {
        logError("No editable profile to save");
      }
    },
    [profileStore, store]
  );
}

// EditableProfileStore version is not reset! See useCommitEditableProfile().
export function commitEditableProfile(
  profile: Profiles.Profile,
  store: AppStore,
  sourceUuid?: string
): void {
  // Store profile
  runInAction(() => (profile.lastModified = new Date()));
  sourceUuid ??=
    store.getState().library.profiles.entities[profile.uuid]?.sourceUuid;
  const profileData = Serializable.fromProfile(profile);
  store.dispatch(
    Library.Profiles.update({
      ...profileData,
      hash: computeProfileHashWithOverrides(profile),
      sourceUuid,
    })
  );
  // Update non editable instance of the profile
  readProfile(profile.uuid, store.getState().library);
}
