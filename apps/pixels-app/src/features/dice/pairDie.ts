import {
  createLibraryProfile,
  Serializable,
} from "@systemic-games/pixels-edit-animation";
import { PixelInfo } from "@systemic-games/react-native-pixels-connect";

import { AppStore } from "~/app/store";
import { Library } from "~/features/store";
import { addPairedDie } from "~/features/store/pairedDiceSlice";
import { generateUuid } from "~/features/utils";

export function pairDie(pixel: PixelInfo, store: AppStore): void {
  let profileUuid =
    store.getState().pairedDice.paired[pixel.pixelId]?.profileUuid ??
    store.getState().pairedDice.unpaired[pixel.pixelId]?.profileUuid;
  if (!profileUuid) {
    // Assuming default profile
    const profile = createLibraryProfile(
      "default",
      pixel.dieType,
      generateUuid()
    );
    store.dispatch(Library.Profiles.add(Serializable.fromProfile(profile)));
    profileUuid = profile.uuid;
  }
  store.dispatch(
    addPairedDie({
      systemId: pixel.systemId,
      pixelId: pixel.pixelId,
      name: pixel.name,
      dieType: pixel.dieType,
      colorway: pixel.colorway,
      firmwareTimestamp: pixel.firmwareDate.getTime(),
      profileUuid,
    })
  );
}
