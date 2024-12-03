import { Profiles } from "@systemic-games/react-native-pixels-connect";

import { useAppSelector } from "~/app/hooks";
import { readCompositeProfile } from "~/features/store";

// Returns an observable composite profile from Redux store
export function useCompositeProfile(
  profileUuid: string
): Readonly<Profiles.CompositeProfile> {
  const library = useAppSelector((state) => state.library);
  return readCompositeProfile(profileUuid, library);
}

export function useOptionalCompositeProfile(
  profileUuid?: string
): Readonly<Profiles.CompositeProfile> | undefined {
  const library = useAppSelector((state) => state.library);
  return profileUuid?.length
    ? readCompositeProfile(profileUuid, library)
    : undefined;
}
