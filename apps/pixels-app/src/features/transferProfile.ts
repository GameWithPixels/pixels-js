import {
  createDataSetForProfile,
  DataSet,
} from "@systemic-games/pixels-edit-animation";
import { Pixel, Profiles } from "@systemic-games/react-native-pixels-connect";
import { Alert } from "react-native";

import {
  clearProfileTransfer,
  setProfileTransfer,
} from "./store/diceRollsSlice";
import { setPairedDieProfile } from "./store/pairedDiceSlice";
import { setProfileHash } from "./store/profilesLibrarySlice";

import { store } from "~/app/store";

export function transferProfile(
  pixel: Pixel,
  profile: Readonly<Profiles.Profile>
): void {
  const ds = createDataSetForProfile(profile);
  console.log(
    `Transferring profile ${profile.name} to die ${pixel.pixelId
      .toString(16)
      .padStart(8)}`
  );
  // TODO update hash for default profiles that were imported without one
  const serializedProfile = store
    .getState()
    .profilesLibrary.profiles.find((p) => p.uuid === profile.uuid);
  if (serializedProfile && !serializedProfile.hash) {
    const hash = DataSet.computeHash(ds.toDataSet().toByteArray());
    store.dispatch(setProfileHash({ uuid: profile.uuid, hash }));
  }
  // TODO update when getting confirmation from the die in usePairedPixels
  store.dispatch(
    setPairedDieProfile({ pixelId: pixel.pixelId, profileUuid: profile.uuid })
  );
  store.dispatch(
    setProfileTransfer({ pixelId: pixel.pixelId, profileUuid: profile.uuid })
  );
  const data = ds.toDataSet();
  pixel
    .transferDataSet(data)
    .catch((e) => {
      console.log(`Error while transferring profile: ${e}`);
      Alert.alert(
        "Failed to Activate Profile",
        "An error occurred while transferring the profile data to the die. The error is " +
          String(e),
        [{ text: "OK" }]
      );
    })
    .finally(() => store.dispatch(clearProfileTransfer()));
}
