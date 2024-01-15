import { assert } from "@systemic-games/pixels-core-utils";
import {
  Profiles,
  Serializable,
} from "@systemic-games/react-native-pixels-connect";
import { autorun, runInAction } from "mobx";

import { useAppDispatch } from "~/app/hooks";
import { store } from "~/app/store";
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

function create(profileUuid: string): Profiles.Profile {
  const profile = readProfile(profileUuid, store.getState().library, true);
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
      const item = editableProfiles.get(profileUuid);
      if (item) {
        const { profile, disposer } = item;
        disposer();
        editableProfiles.delete(profileUuid);
        appDispatch(Library.Profiles.update(Serializable.fromProfile(profile)));
        // Update original profile
        log(
          "update",
          "profile",
          profile.uuid,
          `=> ${profile.dieType}, "${profile.name}"`
        );
        readProfile(profileUuid, store.getState().library);
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
