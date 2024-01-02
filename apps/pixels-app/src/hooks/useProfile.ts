import { Profiles } from "@systemic-games/react-native-pixels-connect";

import { useAppSelector } from "~/app/hooks";
import { getFactoryProfileByUuid } from "~/features/getFactoryProfile";
import { readProfile } from "~/features/store/profiles";

// Returns an observable profile from Redux store
export function useProfile(profileUuid: string): Readonly<Profiles.Profile> {
  const library = useAppSelector((state) => state.profilesLibrary);
  return (
    getFactoryProfileByUuid(profileUuid) ?? readProfile(profileUuid, library)
  );
}
