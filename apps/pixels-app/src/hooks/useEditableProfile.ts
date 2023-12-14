import { assert } from "@systemic-games/pixels-core-utils";
import { Serializable } from "@systemic-games/pixels-edit-animation";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { autorun, runInAction } from "mobx";

import { useAppDispatch } from "~/app/hooks";
import { store } from "~/app/store";
import { factoryProfile } from "~/factoryProfile";
import { readProfile } from "~/features/store/profiles";
import { updateProfile } from "~/features/store/profilesLibrarySlice";

const editableProfiles = new Map<
  string,
  {
    profile: Profiles.Profile;
    onChange: () => void;
  }
>();

function create(profileUuid: string): Profiles.Profile {
  const profile = readProfile(
    profileUuid,
    store.getState().profilesLibrary,
    true
  );
  let firstAutorun = true;
  const onChange = autorun(() => {
    // `JSON.stringify` will touch all properties of the profile` so they are automatically observed.
    JSON.stringify(profile);
    if (!firstAutorun) {
      runInAction(() => (profile.isModified = true));
    }
    firstAutorun = false;
  });
  editableProfiles.set(profileUuid, { profile, onChange });
  return profile;
}

export function getEditableProfile(profileUuid: string): Profiles.Profile {
  assert(profileUuid !== factoryProfile.uuid, "Can't edit factory profile");
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
        profile.lastChanged = new Date();
        appDispatch(updateProfile(Serializable.fromProfile(profile)));
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
