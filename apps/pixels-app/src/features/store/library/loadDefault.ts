import { assert } from "@systemic-games/pixels-core-utils";
import { Serializable } from "@systemic-games/react-native-pixels-connect";

import { LibraryData } from "./LibraryData";
import { createFactoryAnimations, createFactoryProfiles } from "./factory";
import { jsonConvert } from "./jsonConvert";

import StandardProfilesJson from "#/profiles/standard-profiles.json";

export function loadDefault(): LibraryData {
  // Get standard profiles from JSON
  const library = jsonConvert(StandardProfilesJson);
  // Add factory profiles and animations
  const animations = createFactoryAnimations();
  const factoryProfiles = createFactoryProfiles(animations);
  for (const a of animations) {
    const data = Serializable.fromAnimation(a);
    library.animations[data.type].push(data.data as any); // TODO typing
  }
  for (const p of factoryProfiles) {
    const data = Serializable.fromProfile(p);
    library.templates.push(data);
  }
  assert(
    !library.profiles.length,
    "There should be no profiles, only templates"
  );
  return library;
}
