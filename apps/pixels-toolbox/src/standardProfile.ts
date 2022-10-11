import {
  AppDataSet,
  loadAppDataSet,
} from "@systemic-games/pixels-edit-animation";

import niceProfileJson from "~/../assets/nice-profile.json";

const niceProfileAppDataSet: Readonly<AppDataSet> =
  loadAppDataSet(niceProfileJson);

const standardProfile = niceProfileAppDataSet
  .extractForProfile(niceProfileAppDataSet.profiles[0])
  .toDataSet();

export default standardProfile;
