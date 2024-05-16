import { assert } from "@systemic-games/pixels-core-utils";
import {
  Profiles,
  Serializable,
} from "@systemic-games/react-native-pixels-connect";
import { autorun, runInAction } from "mobx";
import React from "react";

import { useAppStore } from "~/app/hooks";
import { Library } from "~/features/store";
import {
  clearEditableProfile,
  touchEditableProfile,
} from "~/features/store/appTransientSlice";
import { readProfile } from "~/features/store/profiles";

// Only one profile can be edited at a time
let editableProfile: Profiles.Profile | undefined;
let editableProfileDisposer: (() => void) | undefined;

// Returns an observable profile that is editable
export function useEditableProfile(profileUuid: string): Profiles.Profile {
  const store = useAppStore();
  if (!editableProfile) {
    const profile = readProfile(profileUuid, store.getState().library, true);
    const disposer = autorun(() => {
      store.dispatch(touchEditableProfile({ profileUuid }));
      // `JSON.stringify` will touch all properties of the profile` so they are automatically observed.
      JSON.stringify(profile);
    });
    editableProfile = profile;
    editableProfileDisposer = () => {
      editableProfile = undefined;
      editableProfileDisposer = undefined;
      disposer();
      store.dispatch(clearEditableProfile());
    };
  }
  assert(editableProfile?.uuid === profileUuid, "Profile mismatch");
  return editableProfile;
}

export function useCommitEditableProfile(): {
  commitProfile: (profileUuid: string) => void;
  discardProfile: (profileUuid: string) => void;
} {
  const store = useAppStore();
  return {
    commitProfile: React.useCallback(
      (profileUuid: string) => {
        assert(editableProfile?.uuid === profileUuid, "Profile mismatch");
        const profile = editableProfile;
        editableProfileDisposer?.();
        // Store profile
        runInAction(() => (profile.lastModified = new Date()));
        store.dispatch(
          Library.Profiles.update(Serializable.fromProfile(profile))
        );
        // Update readonly profile
        readProfile(profileUuid, store.getState().library);
      },
      [store]
    ),
    discardProfile: React.useCallback((profileUuid: string) => {
      assert(editableProfile?.uuid === profileUuid, "Profile mismatch");
      editableProfileDisposer?.();
    }, []),
  };
}
