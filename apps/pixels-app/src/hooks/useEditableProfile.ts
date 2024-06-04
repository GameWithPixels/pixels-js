import {
  Profiles,
  Serializable,
} from "@systemic-games/react-native-pixels-connect";
import { makeAutoObservable, reaction, runInAction } from "mobx";
import React from "react";

import { AppStore } from "~/app/store";
import { computeProfileHashWithOverrides } from "~/features/profiles";
import { Library } from "~/features/store";
import { readProfile } from "~/features/store/profiles";

export class EditableProfileStore {
  private _profile: Profiles.Profile;
  private _disposer?: () => void;
  private _counter = 0;
  private _version = 0;

  get isTaken(): boolean {
    return this._counter > 0;
  }

  get profile(): Profiles.Profile {
    return this._profile;
  }

  get version(): number {
    return this._version;
  }

  constructor(profile: Profiles.Profile) {
    this._profile = profile;
    makeAutoObservable(this);
  }

  take(): () => void {
    if (!this._disposer) {
      this._disposer = reaction(
        () => {
          const profile = this._profile;
          if (profile) {
            // React on all properties of the profile except `lastModified`
            const keys = Object.getOwnPropertyNames(profile);
            return (keys as (keyof Profiles.Profile)[])
              .filter((k) => k !== "lastModified")
              .map((k) => JSON.stringify(profile[k]))
              .join(",");
          }
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
    }
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
  return useEditableProfileStore(profileUuid).profile;
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
