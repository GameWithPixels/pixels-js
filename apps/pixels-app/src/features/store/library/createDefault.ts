import {
  PrebuildAnimations,
  PrebuildAnimationsExt,
} from "@systemic-games/pixels-edit-animation";
import {
  Profiles,
  Serializable,
} from "@systemic-games/react-native-pixels-connect";

import { LibraryData } from "./LibraryData";
import { createFactoryAnimations } from "./factory";
import { jsonConvert } from "./jsonConvert";

import StandardProfilesJson from "#/profiles/standard-profiles.json";

export function createDefault(): LibraryData {
  // Get standard profiles from JSON
  const library = jsonConvert(StandardProfilesJson);

  // Get prebuild animations
  const prebuildAnimations = [
    ...createFactoryAnimations(),
    ...Object.values(PrebuildAnimations),
    ...Object.values(PrebuildAnimationsExt),
  ];

  // Collect gradients, patterns, and animations
  const gradients = new Set<Profiles.RgbGradient>();
  const patterns = new Set<Profiles.Pattern>();
  const animations = new Set<Profiles.Animation>(
    prebuildAnimations.flatMap((a) => a.collectAnimations())
  );
  for (const anim of animations) {
    const { rgb, grayscale } = anim.collectPatterns();
    rgb?.forEach((p) => patterns.add(p));
    grayscale?.forEach((p) => patterns.add(p));
    anim.collectGradients().forEach((g) => gradients.add(g));
  }

  // Add patterns, gradients, and animations to library
  for (const pattern of patterns) {
    const data = Serializable.fromPattern(pattern);
    library.patterns.push(data);
  }
  for (const gradient of gradients) {
    const data = Serializable.fromGradient(gradient);
    library.gradients.push(data);
  }
  for (const anim of animations) {
    const data = Serializable.fromAnimation(anim);
    library.animations[data.type].push(data.data as any); // TODO typing
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
