import {
  Profiles,
  Serializable,
} from "@systemic-games/react-native-pixels-connect";
import { makeAutoObservable, reaction, runInAction } from "mobx";
import React from "react";

import { useAppStore } from "~/app/hooks";
import { AppStore } from "~/app/store";
import { computeProfileHashWithOverrides } from "~/features/profiles";
import { Library, readProfile } from "~/features/store";
import { logError } from "~/features/utils";

export class EditableProfileStore {
  private readonly _profileUuid: string;
  private _profile?: Profiles.Profile;
  private readonly _createProfile: () => Profiles.Profile;
  private _disposer?: () => void;
  private _counter = 0;
  private _version = 0;

  get isTaken(): boolean {
    return this._counter > 0;
  }

  get profile(): Profiles.Profile | undefined {
    return this._profile;
  }

  get version(): number {
    return this._version;
  }

  constructor(profileUuid: string, createProfile: () => Profiles.Profile) {
    this._profileUuid = profileUuid;
    this._createProfile = createProfile;
    makeAutoObservable(this);
  }

  getOrCreateProfile(): Profiles.Profile {
    if (!this._profile) {
      this._profile = this._createProfile();
    }
    return this._profile;
  }

  take(): () => void {
    if (!this._disposer) {
      this._disposer = reaction(
        () => {
          const profile = this.getOrCreateProfile();
          // React on all properties of the profile except `lastModified`
          const keys = Object.getOwnPropertyNames(profile);
          return (keys as (keyof Profiles.Profile)[])
            .filter((k) => k !== "lastModified")
            .map((k) => JSON.stringify(profile[k]))
            .join(",");
        },
        () => this._version++
      );
    }
    this._counter++;
    return () => this.release();
  }

  release(): void {
    this._counter--;
    if (this._counter <= 0) {
      this._disposer?.();
      this._disposer = undefined;
      this._version = 0;
      this._counter = 0;
      this._profile = undefined;
    }
  }

  resetVersion(): void {
    this._version = 0;
  }
}

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
  return useEditableProfileStore(profileUuid).getOrCreateProfile();
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

export function useCommitEditableProfile(profileUuid: string): () => void {
  const store = useAppStore();
  const profileStore = useEditableProfileStore(profileUuid);
  return React.useCallback(() => {
    const profile = profileStore.profile;
    if (profile && profileStore.version) {
      commitEditableProfile(profile, store);
      profileStore.resetVersion();
    } else if (profile) {
      console.log("Skipping saving unmodified profile");
    } else {
      logError("No editable profile to save");
    }
  }, [profileStore, store]);
}

// EditableProfileStore version is not reset! See useCommitEditableProfile().
export function commitEditableProfile(
  profile: Profiles.Profile,
  store: AppStore
): void {
  // Store profile
  runInAction(() => (profile.lastModified = new Date()));
  const sourceUuid =
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
