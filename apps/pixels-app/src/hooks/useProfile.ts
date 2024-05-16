import { Profiles } from "@systemic-games/react-native-pixels-connect";

import { useAppSelector } from "~/app/hooks";
import { readProfile } from "~/features/store/profiles";

// Returns an observable profile from Redux store (except for factory profiles)
export function useProfile(profileUuid: string): Readonly<Profiles.Profile> {
  const library = useAppSelector((state) => state.library);
  return readProfile(profileUuid, library);
}
