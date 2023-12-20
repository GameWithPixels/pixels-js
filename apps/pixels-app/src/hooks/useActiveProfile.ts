import { Pixel, Profiles } from "@systemic-games/react-native-pixels-connect";

import { useProfile } from "./useProfile";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { factoryProfile } from "~/factoryProfile";
import { setPairedDieProfile } from "~/features/store/pairedDiceSlice";

export function useActiveProfile(pixel: Pixel): {
  activeProfile: Readonly<Profiles.Profile>;
  setActiveProfile: (profile: Readonly<Profiles.Profile>) => void;
} {
  const appDispatch = useAppDispatch();
  const activeProfiles = useAppSelector((state) => state.pairedDice.data);
  const setActiveProfile = (profile: Readonly<Profiles.Profile>) =>
    appDispatch(
      setPairedDieProfile({ pixelId: pixel.pixelId, profileUuid: profile.uuid })
    );
  const profileUuid = activeProfiles.find((p) => p.pixelId === pixel.pixelId)
    ?.profileUuid;
  const activeProfile = useProfile(profileUuid ?? factoryProfile.uuid);
  return { activeProfile, setActiveProfile };
}
