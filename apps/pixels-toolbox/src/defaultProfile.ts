import {
  AppDataSet,
  loadAppDataSet,
} from "@systemic-games/pixels-edit-animation";

import defaultProfileJson from "!/default-profile.json";

const niceProfileAppDataSet: Readonly<AppDataSet> =
  loadAppDataSet(defaultProfileJson);

const standardProfile = niceProfileAppDataSet
  .extractForProfile(niceProfileAppDataSet.profiles[0])
  .toDataSet();

export default standardProfile;
