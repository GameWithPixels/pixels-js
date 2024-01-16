import { assert } from "@systemic-games/pixels-core-utils";
import {
  Profiles,
  Serializable,
} from "@systemic-games/react-native-pixels-connect";

import { LibraryData } from "./LibraryData";
import { PrebuildAnimations } from "./PrebuildAnimations";
import { createFactoryAnimations, createFactoryProfiles } from "./factory";
import { jsonConvert } from "./jsonConvert";

import StandardProfilesJson from "#/profiles/standard-profiles.json";

function pushAnim(anim: Profiles.Animation, library: LibraryData) {
  const { rgb, grayscale } = anim.collectPatterns();
  if (rgb?.length) {
    for (const pattern of rgb) {
      const data = Serializable.fromPattern(pattern);
      library.patterns.push(data);
    }
  }
  if (grayscale?.length) {
    for (const pattern of grayscale) {
      const data = Serializable.fromPattern(pattern);
      library.patterns.push(data);
    }
  }
  for (const gradient of anim.collectGradients()) {
    const data = Serializable.fromGradient(gradient);
    library.gradients.push(data);
  }
  const data = Serializable.fromAnimation(anim);
  library.animations[data.type].push(data.data as any); // TODO typing
}

export function createDefault(): LibraryData {
  // Get standard profiles from JSON
  const library = jsonConvert(StandardProfilesJson);
  // Add factory profiles and animations
  const animations = createFactoryAnimations();
  const factoryProfiles = createFactoryProfiles(animations);
  for (const anim of animations) {
    pushAnim(anim, library);
  }
  for (const p of factoryProfiles) {
    const data = Serializable.fromProfile(p);
    library.templates.push(data);
  }
  assert(
    !library.profiles.length,
    "There should be no profiles, only templates"
  );
  // Add prebuild animations
  const prebuildAnimations = Object.values(PrebuildAnimations);
  for (const anim of prebuildAnimations) {
    pushAnim(anim, library);
  }
  // Check
  if (__DEV__) {
    for (const profile of library.profiles) {
      if (!profile.uuid?.length) {
        console.error("Profile without uuid: " + profile.name);
      }
      if (!profile.name?.length) {
        console.warn("Profile without name: " + profile.uuid);
      }
    }
    for (const template of library.templates) {
      if (!template.uuid?.length) {
        console.error("Template without uuid: " + template.name);
      }
      if (!template.name?.length) {
        console.warn("Template without name: " + template.uuid);
      }
    }
    for (const anim of Object.values(library.animations).flat()) {
      if (!anim.uuid?.length) {
        console.error("Animation without uuid: " + anim.name);
      }
      if (!anim.name?.length) {
        console.warn("Animation without name: " + anim.uuid);
      }
    }
    for (const pattern of library.patterns) {
      if (!pattern.uuid?.length) {
        console.error("Pattern without uuid: " + pattern.name);
      }
      if (!pattern.name?.length) {
        console.warn("Pattern without name: " + pattern.uuid);
      }
    }
    for (const gradient of library.gradients) {
      if (!gradient.uuid?.length) {
        console.error("Gradient without uuid");
      }
    }
  }
  return library;
}
