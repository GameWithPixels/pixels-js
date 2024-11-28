import {
  AnimConstants,
  createLibraryProfile,
  PrebuildAnimations,
  PrebuildProfilesNames,
} from "@systemic-games/pixels-edit-animation";
import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";

import { generateProfileUuid } from "./generateProfileUuid";

import { LibraryState } from "~/app/store";

function createMegaProfile(
  dieType: PixelDieType,
  uuid?: string
): Profiles.Profile {
  const profile = new Profiles.Profile({
    uuid,
    dieType,
    name: "_Mega Profile",
  });

  const pushAnim = function (anim: Profiles.Animation) {
    profile.rules.push(
      new Profiles.Rule(
        new Profiles.ConditionCrooked(),
        new Profiles.ActionPlayAnimation({
          animation: anim,
          face: AnimConstants.currentFaceIndex,
        })
      )
    );
  };

  for (const anim of Object.values(PrebuildAnimations)) {
    pushAnim(anim);
  }

  return profile;
}

export function createProfileTemplates(
  dieType: PixelDieType,
  library?: LibraryState
): Profiles.Profile[] {
  // TODO use library to get animations, patterns and gradients
  return [
    createMegaProfile(dieType, library && generateProfileUuid(library)),
    ...PrebuildProfilesNames.map((name) => {
      return createLibraryProfile(
        name,
        dieType,
        library && generateProfileUuid(library)
      );
    }),
  ];
}
