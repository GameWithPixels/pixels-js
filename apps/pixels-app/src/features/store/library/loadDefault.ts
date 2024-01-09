import { Serializable } from "@systemic-games/react-native-pixels-connect";

import { createFactoryAnimations, createFactoryProfiles } from "./factory";
import { jsonConvert } from "./jsonConvert";

import StandardProfilesJson from "#/profiles/standard-profiles.json";

export function loadDefault(): Serializable.LibraryData {
  console.log("=== LOADING DEFAULT LIBRARY ===");
  // Get standard profiles from JSON
  const library = jsonConvert(StandardProfilesJson);
  // Add factory profiles and animations
  const animations = createFactoryAnimations();
  const profiles = createFactoryProfiles(animations);
  for (const a of animations) {
    const data = Serializable.fromAnimation(a);
    library.animations[data.type].push(data.data as any); // TODO typing
  }
  for (const p of profiles) {
    const data = Serializable.fromProfile(p);
    library.profiles.push(data);
  }
  return library;
}
