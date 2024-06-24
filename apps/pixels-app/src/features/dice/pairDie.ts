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
  const { library } = store.getState();
  let brightness = library.profiles.entities[profileUuid ?? -1]?.brightness;
  if (
    !profileUuid ||
    !!sourceProfile ||
    brightness === undefined // undefined if die profile not found
  ) {
    // Use profile with pre-serialized data so the hash is stable
    const dieProfile = preSerializeProfile(
      // Use default profile if none provided
      sourceProfile ?? createLibraryProfile("default", pixel.dieType),
      library
    );
    profileUuid = generateProfileUuid(library);
    store.dispatch(
      Library.Profiles.add({
        ...Serializable.fromProfile(dieProfile),
        uuid: profileUuid,
        hash: computeProfileHashWithOverrides(dieProfile),
        sourceUuid: sourceProfile?.uuid,
      })
    );
    brightness = dieProfile.brightness;
  }
  brightness *= store.getState().appSettings.diceBrightnessFactor;
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
      brightness,
    })
  );
}
