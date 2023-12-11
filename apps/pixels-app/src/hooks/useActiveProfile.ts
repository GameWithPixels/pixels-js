import { assert } from "@systemic-games/pixels-core-utils";
import { Pixel, Profiles } from "@systemic-games/react-native-pixels-connect";

import { useProfiles } from "./useProfiles";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { setPairedDieProfile } from "~/features/store/pairedDiceSlice";

export function useActiveProfile(pixel: Pixel): {
  activeProfile: Profiles.Profile;
  setActiveProfile: (profile: Profiles.Profile) => void;
} {
  const appDispatch = useAppDispatch();
  const activeProfiles = useAppSelector((state) => state.pairedDice.diceData);
  const setActiveProfile = (profile: Profiles.Profile) =>
    appDispatch(
      setPairedDieProfile({ pixelId: pixel.pixelId, profileUuid: profile.uuid })
    );
  const profileUuid = activeProfiles.find(
    (p) => p.pixelId === pixel.pixelId
  )?.profileUuid;
  const { profiles } = useProfiles();
  const activeProfile =
    (profileUuid ? profiles.find((p) => p.uuid === profileUuid) : undefined) ??
    profiles[0];
  assert(activeProfile);
  return { activeProfile, setActiveProfile };
}
