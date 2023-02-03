import {
  EditProfile,
  DataSet,
  loadAppDataSet,
} from "@systemic-games/pixels-edit-animation";

import StandardProfilesJson from "!/profiles/standard-profiles.json";

export const MyAppDataSet = loadAppDataSet(StandardProfilesJson);
const profilesDataSet = new Map<EditProfile, DataSet>();

export function extractDataSet(profile: EditProfile): DataSet {
  let animData = profilesDataSet.get(profile);
  if (!animData) {
    animData = MyAppDataSet.extractForProfile(profile).toDataSet();
    profilesDataSet.set(profile, animData);
  }
  return animData;
}
