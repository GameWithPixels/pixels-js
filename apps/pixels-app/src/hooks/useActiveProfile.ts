import { Pixel, Profiles } from "@systemic-games/react-native-pixels-connect";

import { useProfile } from "./useProfile";

import { useAppSelector } from "~/app/hooks";
import { FactoryProfile } from "~/features/profiles";

export function useActiveProfile(pixel: Pixel): Readonly<Profiles.Profile> {
  const profileUuid = useAppSelector(
    (state) =>
      state.pairedDice.dice.find((d) => d.pixelId === pixel.pixelId)
        ?.profileUuid
  );
  // const setActiveProfile = (profile: Readonly<Profiles.Profile>) =>
  //   appDispatch(
  //     setPairedDieProfile({ pixelId: pixel.pixelId, profileUuid: profile.uuid })
  //   );
  const activeProfile = useProfile(
    profileUuid ?? FactoryProfile.get(pixel.dieType).uuid
  );
  return activeProfile;
}
