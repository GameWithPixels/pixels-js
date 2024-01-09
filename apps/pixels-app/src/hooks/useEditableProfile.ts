import { assert } from "@systemic-games/pixels-core-utils";
import {
  Profiles,
  Serializable,
} from "@systemic-games/react-native-pixels-connect";
import { autorun, runInAction } from "mobx";

import { useAppDispatch } from "~/app/hooks";
import { store } from "~/app/store";
import { FactoryProfile } from "~/features/FactoryProfile";
import { Library } from "~/features/store";
import { readProfile } from "~/features/store/profiles";

const editableProfiles = new Map<
  string,
  {
    profile: Profiles.Profile;
    onChange: () => void;
  }
>();

function create(profileUuid: string): Profiles.Profile {
  const profile = readProfile(profileUuid, store.getState().library, true);
  let firstAutorun = true;
  const onChange = autorun(() => {
    if (firstAutorun) {
      // `JSON.stringify` will touch all properties of the profile` so they are automatically observed.
      JSON.stringify(profile);
      firstAutorun = false;
    } else {
      // TODO remove from EditProfile
      runInAction(() => (profile.isModified = true));
    }
  });
  editableProfiles.set(profileUuid, { profile, onChange });
  return profile;
}

export function getEditableProfile(profileUuid: string): Profiles.Profile {
  assert(!FactoryProfile.isFactory(profileUuid), "Can't edit factory profile");
  return editableProfiles.get(profileUuid)?.profile ?? create(profileUuid);
}

export function useCommitEditableProfile(): {
  commitProfile: (profileUuid: string) => void;
  discardProfile: (profileUuid: string) => void;
} {
  const appDispatch = useAppDispatch();
  return {
    commitProfile: (profileUuid: string) => {
      const profile = editableProfiles.get(profileUuid)?.profile;
      if (profile) {
        runInAction(() => (profile.lastChanged = new Date()));
        appDispatch(Library.Profiles.update(Serializable.fromProfile(profile)));
        editableProfiles.delete(profileUuid);
      }
    },
    discardProfile: (profileUuid: string) =>
      editableProfiles.delete(profileUuid),
  };
}

// Returns an observable profile that is editable
export function useEditableProfile(profileUuid: string): Profiles.Profile {
  return getEditableProfile(profileUuid); // TODO not reactive but that's ok for your usage
}
