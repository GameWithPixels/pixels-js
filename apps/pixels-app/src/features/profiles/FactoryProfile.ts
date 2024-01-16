import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";

import { store } from "~/app/store";
import {
  getFactoryProfileUuid,
  isFactoryProfileUuid,
  addFactoryAdvancedRules,
  createFactoryProfile,
  getFactoryProfileDieType,
} from "~/features/store/library/factory";
import { readAnimation } from "~/features/store/profiles";

function fixDieType(dieType?: PixelDieType): PixelDieType {
  // TODO Assumes D20 for unknown die type
  return !dieType || dieType === "unknown" ? "d20" : dieType;
}

export const FactoryProfile = {
  getUuid(dieType: PixelDieType): string {
    return getFactoryProfileUuid(dieType);
  },

  get(dieType: PixelDieType): Readonly<Profiles.Profile> {
    const library = store.getState().library;
    return createFactoryProfile(fixDieType(dieType), (uuid) =>
      readAnimation(uuid, library)
    );
  },

  getByUuid(profileUuid: string): Readonly<Profiles.Profile> | undefined {
    const dieType = getFactoryProfileDieType(profileUuid);
    if (dieType !== "unknown") {
      return FactoryProfile.get(dieType);
    }
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
