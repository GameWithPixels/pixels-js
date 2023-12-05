import { Pixel } from "@systemic-games/react-native-pixels-connect";

import { useProfiles } from "./useProfiles";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { defaultProfile } from "~/data";
import { setPairedDieProfile } from "~/features/store/pairedDiceSlice";
import { PixelProfile } from "~/temp";

export function useActiveProfile(pixel: Pixel): {
  activeProfile: PixelProfile;
  setActiveProfile: (profile: PixelProfile) => void;
} {
  const appDispatch = useAppDispatch();
  const activeProfiles = useAppSelector((state) => state.pairedDice.diceData);
  const setActiveProfile = (profile: PixelProfile) =>
    appDispatch(
      setPairedDieProfile({ pixelId: pixel.pixelId, profileUuid: profile.uuid })
    );
  const profileUuid = activeProfiles.find(
    (p) => p.pixelId === pixel.pixelId
  )?.profileUuid;
  const { profiles } = useProfiles();
  const activeProfile =
    (profileUuid ? profiles.find((p) => p.uuid === profileUuid) : undefined) ??
    defaultProfile;
  return { activeProfile, setActiveProfile };
}
