import { assert } from "@systemic-games/pixels-core-utils";
import {
  PixelInfo,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";

import { useProfile } from "./useProfile";

import { useAppSelector } from "~/app/hooks";
import { unsigned32ToHex } from "~/features/utils";

export function useActiveProfile(
  pixel: Pick<PixelInfo, "pixelId" | "dieType">
): Readonly<Profiles.Profile> {
  const profileUuid = useAppSelector(
    (state) =>
      state.pairedDice.paired.find((d) => d.pixelId === pixel.pixelId)
        ?.profileUuid
  );
  // const setActiveProfile = (profile: Readonly<Profiles.Profile>) =>
  //   appDispatch(
  //     setPairedDieProfile({ pixelId: pixel.pixelId, profileUuid: profile.uuid })
  //   );
  assert(
    profileUuid?.length,
    `No active profile found for pixel ${unsigned32ToHex(pixel.pixelId)}`
  );
  return useProfile(profileUuid);
}
