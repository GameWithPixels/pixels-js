import { Profiles } from "@systemic-games/react-native-pixels-connect";

import { useAppSelector } from "~/app/hooks";
import { factoryProfile } from "~/factoryProfile";
import { readProfile } from "~/features/store/profiles";

// Returns an observable profile from Redux store
export function useProfile(profileUuid: string): Readonly<Profiles.Profile> {
  const library = useAppSelector((state) => state.profilesLibrary);
  return profileUuid === factoryProfile.uuid
    ? factoryProfile
    : readProfile(profileUuid, library);
}
