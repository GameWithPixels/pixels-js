import { Profiles } from "@systemic-games/react-native-pixels-connect";

import { useAppSelector } from "~/app/hooks";
import { readProfile } from "~/features/store/profiles";
import { factoryProfile } from "~/temp";

// Returns an observable profile from Redux store
export function useProfile(profileUuid: string): Readonly<Profiles.Profile> {
  const library = useAppSelector((state) => state.profilesLibrary);
  return profileUuid === "factory"
    ? factoryProfile
    : readProfile(profileUuid, library);
}
