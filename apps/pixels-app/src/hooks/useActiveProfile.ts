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
  const profileUuid = useAppSelector(
    (state) =>
      state.pairedDice.dice.find((p) => p.pixelId === pixel.pixelId)
        ?.profileUuid
  );
  const setActiveProfile = (profile: Readonly<Profiles.Profile>) =>
    appDispatch(
      setPairedDieProfile({ pixelId: pixel.pixelId, profileUuid: profile.uuid })
    );
  const activeProfile = useProfile(
    profileUuid ?? getDefaultProfile(pixel.dieType).uuid
  );
  return { activeProfile, setActiveProfile };
}
