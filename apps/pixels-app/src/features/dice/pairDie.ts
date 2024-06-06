import {
  createLibraryProfile,
  Serializable,
} from "@systemic-games/pixels-edit-animation";
import { PixelInfo } from "@systemic-games/react-native-pixels-connect";

import {
  computeProfileHashWithOverrides,
  generateProfileUuid,
} from "../profiles";

import { AppStore } from "~/app/store";
import { Library } from "~/features/store";
import { addPairedDie } from "~/features/store/pairedDiceSlice";
import { preSerializeProfile } from "~/features/store/profiles";

export function pairDie(pixel: PixelInfo, store: AppStore): void {
  const { pairedDice } = store.getState();
  let profileUuid =
    pairedDice.paired[pixel.pixelId]?.profileUuid ??
    pairedDice.unpaired[pixel.pixelId]?.profileUuid;
  if (!profileUuid) {
    // Use profile with pre-serialized data so the hash is stable
    const profile = preSerializeProfile(
      // Assuming default profile
      createLibraryProfile(
        "default",
        pixel.dieType,
        generateProfileUuid(store.getState().library)
      ),
      store.getState().library
    );
    store.dispatch(
      Library.Profiles.add({
        ...Serializable.fromProfile(profile),
        hash: computeProfileHashWithOverrides(profile),
      })
    );
    profileUuid = profile.uuid;
  }
  store.dispatch(
    addPairedDie({
      systemId: pixel.systemId,
      pixelId: pixel.pixelId,
      name: pixel.name,
      ledCount: pixel.ledCount,
      colorway: pixel.colorway,
      dieType: pixel.dieType,
      firmwareTimestamp: pixel.firmwareDate.getTime(),
      profileUuid,
    })
  );
}
