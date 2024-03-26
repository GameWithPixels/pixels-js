import { assert } from "@systemic-games/pixels-core-utils";
import {
  Profiles,
  Serializable,
} from "@systemic-games/react-native-pixels-connect";
import { autorun, runInAction } from "mobx";
import React from "react";
import { useStore } from "react-redux";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { LibraryState, RootState } from "~/app/store";
import { FactoryProfile } from "~/features/profiles";
import { Library } from "~/features/store";
import { log } from "~/features/store/library/log";
import { readProfile } from "~/features/store/profiles";

const editableProfiles = new Map<
  string,
  {
    profile: Profiles.Profile;
    disposer: () => void;
  }
>();

function create(profileUuid: string, library: LibraryState): Profiles.Profile {
  const profile = readProfile(profileUuid, library, true);
  let firstAutorun = true;
  const disposer = autorun(() => {
    if (firstAutorun) {
      // `JSON.stringify` will touch all properties of the profile` so they are automatically observed.
      JSON.stringify(profile);
      firstAutorun = false;
    } else {
      disposer();
      runInAction(() => (profile.lastChanged = new Date()));
    }
  });
  editableProfiles.set(profileUuid, { profile, disposer });
  return profile;
}

export function getEditableProfile(
  profileUuid: string,
  library: LibraryState
): Profiles.Profile {
  assert(!FactoryProfile.isFactory(profileUuid), "Can't edit factory profile");
  return (
    editableProfiles.get(profileUuid)?.profile ?? create(profileUuid, library)
  );
}

export function useCommitEditableProfile(): {
  commitProfile: (profileUuid: string) => void;
  discardProfile: (profileUuid: string) => void;
} {
  const appDispatch = useAppDispatch();
  const store = useStore(); // We use the store because don't want to react on every state change
  return {
    commitProfile: React.useCallback(
      (profileUuid: string) => {
        const item = editableProfiles.get(profileUuid);
        if (item) {
          const { profile, disposer } = item;
          disposer();
          editableProfiles.delete(profileUuid);
          appDispatch(
            Library.Profiles.update(Serializable.fromProfile(profile))
          );
          // Update original profile
          log(
            "update",
            "profile",
            profile.uuid,
            `=> ${profile.dieType}, "${profile.name}"`
          );
          readProfile(profileUuid, (store.getState() as RootState).library);
        }
      },
      [appDispatch, store]
    ),
    discardProfile: React.useCallback(
      (profileUuid: string) => editableProfiles.delete(profileUuid),
      []
    ),
  };
}

// Returns an observable profile that is editable
export function useEditableProfile(profileUuid: string): Profiles.Profile {
  const library = useAppSelector((state) => state.library);
  return getEditableProfile(profileUuid, library);
}
