import {
  AppDataSet,
  loadAppDataSet,
} from "@systemic-games/pixels-edit-animation";

import StandardProfilesJson from "!/profiles/standard-profiles.json";

const StandardProfiles: Readonly<AppDataSet> =
  loadAppDataSet(StandardProfilesJson);

export default StandardProfiles;
