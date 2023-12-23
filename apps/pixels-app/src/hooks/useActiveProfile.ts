import { Pixel, Profiles } from "@systemic-games/react-native-pixels-connect";

import { useProfile } from "./useProfile";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { getDefaultProfile } from "~/features/getDefaultProfile";
import { setPairedDieProfile } from "~/features/store/pairedDiceSlice";

export function useActiveProfile(pixel: Pixel): {
  activeProfile: Readonly<Profiles.Profile>;
  setActiveProfile: (profile: Readonly<Profiles.Profile>) => void;
} {
  const appDispatch = useAppDispatch();
  const activeProfiles = useAppSelector((state) => state.pairedDice.dice);
  const setActiveProfile = (profile: Readonly<Profiles.Profile>) =>
    appDispatch(
      setPairedDieProfile({ pixelId: pixel.pixelId, profileUuid: profile.uuid })
    );
  const profileUuid = activeProfiles.find((p) => p.pixelId === pixel.pixelId)
    ?.profileUuid;
  const activeProfile = useProfile(
    profileUuid ?? getDefaultProfile(pixel.dieType).uuid
  );
  return { activeProfile, setActiveProfile };
}
