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
  opt?: {
    sourceProfile?: Readonly<Profiles.Profile>;
    forceNewProfile?: boolean;
  }
): void {
  const { pairedDice, library } = store.getState();
  let profileUuid = opt?.forceNewProfile
    ? undefined
    : (pairedDice.paired.find((p) => p.pixelId === pixel.pixelId)
        ?.profileUuid ??
      pairedDice.unpaired.find((p) => p.pixelId === pixel.pixelId)
        ?.profileUuid);
  // Create new profile if die profile not found or same as source profile
  let brightness = library.profiles.entities[profileUuid ?? -1]?.brightness;
  if (
    !profileUuid ||
    !library.profiles.ids.includes(profileUuid) ||
    !!opt?.sourceProfile ||
    brightness === undefined // undefined if die profile not found
  ) {
    // Use profile with pre-serialized data so the hash is stable
    const dieProfile = preSerializeProfile(
      // Use default profile if none provided
      opt?.sourceProfile ?? createLibraryProfile("default", pixel.dieType),
      library
    );
    // Assign an id if none (or if invalid because of bug with generateUuid())
    const givenUuid = profileUuid;
    if (typeof profileUuid !== "string") {
      profileUuid = generateProfileUuid(library);
    }
    console.log(
      (givenUuid !== profileUuid ? "Creating new" : "Updating") +
        ` profile (${profileUuid}) on pairing die ${pixel.name}`
    );
    // Add or update profile
    store.dispatch(
      Library.Profiles.update({
        ...Serializable.fromProfile(dieProfile),
        uuid: profileUuid,
        hash: computeProfileHashWithOverrides(dieProfile),
        sourceUuid: opt?.sourceProfile?.uuid,
        // Older versions of the app might have stored the wrong dieType
        dieType: pixel.dieType,
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
