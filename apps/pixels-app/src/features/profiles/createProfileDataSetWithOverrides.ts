import {
  createDataSetForProfile,
  DataSet,
  EditDataSet,
} from "@systemic-games/pixels-edit-animation";
import { Profiles } from "@systemic-games/react-native-pixels-connect";

import { applyProfileOverrides } from "./applyOverrides";

export function createProfileEditDataSetWithOverrides(
  profile: Readonly<Profiles.Profile>,
  brightnessFactor?: number
): EditDataSet {
  return createDataSetForProfile(
    applyProfileOverrides(profile),
    brightnessFactor
  );
}

export function createProfileDataSetWithOverrides(
  profile: Readonly<Profiles.Profile>,
  brightnessFactor?: number
): DataSet {
  return createProfileEditDataSetWithOverrides(
    profile,
    brightnessFactor
  ).toDataSet();
}

export function computeProfileHashWithOverrides(
  profile: Readonly<Profiles.Profile>
): number {
  return DataSet.computeHash(
    createProfileDataSetWithOverrides(profile).toByteArray()
  );
}
