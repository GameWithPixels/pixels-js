import { createLibraryProfile } from "@systemic-games/pixels-edit-animation";
import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";

const profilesUuidsMap = {
  unknown: "8c7d22e1-78ea-4433-86d3-298311f4414a",
  d20: "3a1997bd-5a10-4475-a7f5-57d8f1a7e6c5",
  d12: "d5b70abf-0f3d-450a-a43e-07781de25762",
  d10: "9f4f4365-4c41-42b6-9c66-25a603470702",
  d00: "c9562fb9-0fc1-43a6-81ed-fa6caec8f781",
  d8: "d2ce420e-1c38-47a5-b9ba-10d27b06a56c",
  d6: "9291dbb5-f864-4f94-bfb7-e035b8a914f4",
  d4: "0b02249f-0476-466f-8115-18addf754047",
  d6pipped: "e167fd5b-30d5-45f7-a841-316d4acae5a1",
  d6fudge: "99f2b7d7-fbd1-47d9-b7a3-a4e90d806ff9",
} as const;

const profilesUuidsReverse = Object.fromEntries(
  Object.entries(profilesUuidsMap).map(([k, v]) => [v, k as PixelDieType])
);

const profilesUuids: string[] = Object.values(profilesUuidsMap);

export const FactoryProfile = {
  getUuid(dieType: PixelDieType): string {
    return profilesUuidsMap[dieType];
  },

  get(dieType: PixelDieType): Readonly<Profiles.Profile> {
    // TODO use library to get animations, patterns and gradients
    return createLibraryProfile("default", dieType, profilesUuidsMap[dieType]);
  },

  getByUuid(profileUuid: string): Readonly<Profiles.Profile> | undefined {
    const dieType = profilesUuidsReverse[profileUuid];
    if (dieType) {
      return FactoryProfile.get(dieType);
    }
  },

  isFactory(uuid: string): boolean {
    return profilesUuids.includes(uuid);
  },
} as const;
