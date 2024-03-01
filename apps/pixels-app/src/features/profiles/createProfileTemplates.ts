import {
  createLibraryProfile,
  PrebuildProfilesNames,
} from "@systemic-games/pixels-edit-animation";
import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";

import { LibraryState } from "~/app/store";
import { generateUuid } from "~/features/utils";

export function createProfileTemplates(
  dieType: PixelDieType,
  _library: LibraryState
): Profiles.Profile[] {
  // TODO use library to get animations, patterns and gradients
  return PrebuildProfilesNames.map((name) =>
    createLibraryProfile(name, dieType, generateUuid())
  );
}
