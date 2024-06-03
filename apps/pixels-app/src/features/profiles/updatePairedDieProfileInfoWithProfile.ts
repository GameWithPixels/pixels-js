import { unsigned32ToHex } from "@systemic-games/pixels-core-utils";
import { DataSet, Profiles } from "@systemic-games/react-native-pixels-connect";

import { createProfileDataSet } from "./createProfileDataSet";

import { updatePairedDieProfileInfo } from "~/features/store/pairedDiceSlice";

export function updatePairedDieProfileInfoWithProfile(
  pixelId: number,
  profile: Readonly<Profiles.Profile>,
  brightnessFactor: number,
  noProfileSource = false
) {
  const dataSet = createProfileDataSet(profile, brightnessFactor);
  const hash = DataSet.computeHash(dataSet.toByteArray());
  console.log(">>>> DIE PROFILE HASH = " + unsigned32ToHex(hash));
  return updatePairedDieProfileInfo({
    pixelId,
    hash,
    sourceProfileUuid: noProfileSource ? false : profile.uuid,
  });
}
