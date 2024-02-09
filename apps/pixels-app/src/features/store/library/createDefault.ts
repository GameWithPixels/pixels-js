import { PrebuildAnimations } from "@systemic-games/pixels-edit-animation";
import {
  Profiles,
  Serializable,
} from "@systemic-games/react-native-pixels-connect";

import { LibraryData } from "./LibraryData";
import { createFactoryAnimations } from "./factory";
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

  // Add factory animations
  const animations = createFactoryAnimations();
  for (const anim of animations) {
    pushAnim(anim, library);
  }

  // Add prebuild animations
  const prebuildAnimations = Object.values(PrebuildAnimations);
  for (const anim of prebuildAnimations) {
    pushAnim(anim, library);
  }

  // Checks
  if (__DEV__) {
    if (library.profiles.length) {
      console.error("Profile found in default library");
    }
    const check = (
      entityType: string,
      entities: { uuid: string; name?: string }[],
      skipName = false
    ) => {
      for (const e of entities) {
        if (!e.uuid?.length) {
          console.error(`Missing uuid for ${entityType} ${e.name}`);
        }
        if (!skipName && !e.name?.length) {
          console.error(`Missing name for ${entityType} ${e.name}`);
        }
      }
    };
    check("profile", library.profiles);
    for (const e of Object.entries(library.animations)) {
      check(e[0], e[1]);
    }
    check("patterns", library.patterns);
    check("gradients", library.gradients, true);

    // Check that uuids are unique
    const allUuids = library.profiles
      .map((p) => p.uuid)
      .concat(
        Object.values(library.animations)
          .flat()
          .map((a) => a.uuid)
      )
      .concat(library.patterns.map((p) => p.uuid))
      .concat(library.gradients.map((g) => g.uuid));
    if (new Set(allUuids).size !== allUuids.length) {
      console.error("Duplicated UUID in library");
      for (const uuid of allUuids) {
        if (allUuids.filter((u) => u === uuid).length > 1) {
          console.log("Duplicate: " + uuid);
        }
      }
    }
  }
  return library;
}
