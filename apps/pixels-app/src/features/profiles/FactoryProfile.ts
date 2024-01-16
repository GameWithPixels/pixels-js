import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";

import { store } from "~/app/store";
import {
  getFactoryProfileUuid,
  isFactoryProfileUuid,
  addFactoryAdvancedRules,
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
    const library = store.getState().library;
    addFactoryAdvancedRules(profile, (uuid) => readAnimation(uuid, library));
    return profile;
  },
} as const;
