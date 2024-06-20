import {
  createLibraryProfile,
  Serializable,
} from "@systemic-games/pixels-edit-animation";
import {
  PixelInfo,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";

import {
  computeProfileHashWithOverrides,
  generateProfileUuid,
} from "../profiles";

import { AppStore } from "~/app/store";
import { Library, addPairedDie, preSerializeProfile } from "~/features/store";

export function pairDie(
  pixel: Pick<
    PixelInfo,
    | "systemId"
    | "pixelId"
    | "name"
    | "ledCount"
    | "colorway"
    | "dieType"
    | "firmwareDate"
  >,
  store: AppStore,
  sourceProfile?: Readonly<Profiles.Profile>
): void {
  const { pairedDice } = store.getState();
  let profileUuid =
    pairedDice.paired.find((p) => p.pixelId === pixel.pixelId)?.profileUuid ??
    pairedDice.unpaired.find((p) => p.pixelId === pixel.pixelId)?.profileUuid;
  // Create new profile if die profile not found or same as source profile
  if (
    !profileUuid ||
    !store.getState().library.profiles.ids.includes(profileUuid) ||
    profileUuid === sourceProfile?.uuid
  ) {
    // Use profile with pre-serialized data so the hash is stable
    const dieProfile = preSerializeProfile(
      // Use default profile if none provided
      sourceProfile ?? createLibraryProfile("default", pixel.dieType),
      store.getState().library
    );
    profileUuid = generateProfileUuid(store.getState().library);
    store.dispatch(
      Library.Profiles.add({
        ...Serializable.fromProfile(dieProfile),
        uuid: profileUuid,
        hash: computeProfileHashWithOverrides(dieProfile),
        sourceUuid: sourceProfile?.uuid,
      })
    );
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
