import { PixelDieType } from "@systemic-games/pixels-core-connect";
import { Profiles } from "@systemic-games/react-native-pixels-connect";

import { store } from "~/app/store";
import {
  getFactoryProfileUuid,
  isFactoryProfileUuid,
  getFactoryAnimationUuid,
  addFactoryAdvancedRules,
  type FactoryAnimationName,
} from "~/features/store/library/factory";
import { readAnimation, readProfile } from "~/features/store/profiles";

function fixDieType(dieType?: PixelDieType): PixelDieType {
  // TODO Assumes D20 for unknown die type
  return !dieType || dieType === "unknown" ? "d20" : dieType;
}

export const FactoryProfile = {
  getUuid(dieType: PixelDieType): string {
    return getFactoryProfileUuid(dieType);
  },

  get(dieType: PixelDieType): Readonly<Profiles.Profile> {
    const profileUuid = getFactoryProfileUuid(fixDieType(dieType));
    return readProfile(profileUuid, store.getState().library);
  },

  getByUuid(profileUuid: string): Readonly<Profiles.Profile> | undefined {
    if (FactoryProfile.isFactory(profileUuid)) {
      return readProfile(profileUuid, store.getState().library);
    }
    return undefined;
  },

  isFactory(uuid: string): boolean {
    return isFactoryProfileUuid(uuid);
  },

  addAdvancedRules(profile: Profiles.Profile): Profiles.Profile {
    const dieType = fixDieType(profile.dieType);
    const library = store.getState().library;
    const getAnimation = (name: FactoryAnimationName) => {
      const uuid = getFactoryAnimationUuid(name, dieType);
      return readAnimation(uuid, library);
    };
    addFactoryAdvancedRules(profile, getAnimation);
    return profile;
  },
} as const;
