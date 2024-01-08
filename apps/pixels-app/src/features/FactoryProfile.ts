import { PixelDieType } from "@systemic-games/pixels-core-connect";
import { Profiles } from "@systemic-games/react-native-pixels-connect";

import { store } from "~/app/store";
import {
  addFactoryAdvancedRules,
  FactoryAnimationType,
  getFactoryAnimationUuid,
  getFactoryProfileUuid,
  isFactoryProfileUuid,
  readAnimation,
  readProfile,
} from "~/features/store/profiles";

export const FactoryProfile = {
  getUuid(dieType: PixelDieType): string {
    return getFactoryProfileUuid(dieType);
  },

  get(dieType: PixelDieType): Readonly<Profiles.Profile> {
    if (!dieType || dieType === "unknown") {
      // Assume D20 for unknown die type for now
      dieType = "d20";
    }
    const profileUuid = getFactoryProfileUuid(dieType);
    const library = store.getState().profilesLibrary;
    return readProfile(profileUuid, library);
  },

  getByUuid(profileUuid: string): Readonly<Profiles.Profile> | undefined {
    if (FactoryProfile.isFactory(profileUuid)) {
      const library = store.getState().profilesLibrary;
      return readProfile(profileUuid, library);
    }
  },

  isFactory(uuid: string): boolean {
    return isFactoryProfileUuid(uuid);
  },

  addAdvancedRules(profile: Profiles.Profile): Profiles.Profile {
    const dieType = profile.dieType ?? "d20";
    const library = store.getState().profilesLibrary;
    const getAnimation = (animType: FactoryAnimationType) => {
      const uuid = getFactoryAnimationUuid(animType, dieType);
      return readAnimation(uuid, library);
    };
    addFactoryAdvancedRules(profile, getAnimation);
    return profile;
  },
} as const;
