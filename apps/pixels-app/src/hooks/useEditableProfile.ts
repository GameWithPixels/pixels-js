import { assert } from "@systemic-games/pixels-core-utils";
import { Serializable } from "@systemic-games/pixels-edit-animation";
import { Profiles } from "@systemic-games/react-native-pixels-connect";

import { useAppDispatch } from "~/app/hooks";
import { store } from "~/app/store";
import { readProfile } from "~/features/store/profiles";
import { updateProfile } from "~/features/store/profilesLibrarySlice";

const editableProfiles = new Map<string, Profiles.Profile>();

function create(profileUuid: string): Profiles.Profile {
  const profile = readProfile(
    profileUuid,
    store.getState().profilesLibrary,
    true
  );
  editableProfiles.set(profileUuid, profile);
  return profile;
}

export function getEditableProfile(profileUuid: string): Profiles.Profile {
  assert(profileUuid !== "factory", "Can't edit factory profile");
  return editableProfiles.get(profileUuid) ?? create(profileUuid);
}

export function useCommitEditableProfile() {
  const appDispatch = useAppDispatch();
  return (profileUuid: string) => {
    const profile = editableProfiles.get(profileUuid);
    if (profile) {
      appDispatch(updateProfile(Serializable.fromProfile(profile)));
    }
  };
}

export function discardEditableProfile(profileUuid: string): void {
  editableProfiles.delete(profileUuid);
}

// Returns an observable profile that is editable
export function useEditableProfile(profileUuid: string): Profiles.Profile {
  return getEditableProfile(profileUuid); // TODO not reactive but that's ok for your usage
}
