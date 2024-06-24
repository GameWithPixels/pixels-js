import {
  createLibraryProfile,
  PrebuildProfilesNames,
} from "@systemic-games/pixels-edit-animation";
import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";

import { generateProfileUuid } from "./generateProfileUuid";

import { LibraryState } from "~/app/store";

export function createProfileTemplates(
  dieType: PixelDieType,
  library?: LibraryState
): Profiles.Profile[] {
  // TODO use library to get animations, patterns and gradients
  return PrebuildProfilesNames.map((name) => {
    return createLibraryProfile(
      name,
      dieType,
      library && generateProfileUuid(library)
    );
  });
}
