import {
  DataSet,
  Json,
  createDataSetForProfile,
  loadAppDataSet,
} from "@systemic-games/pixels-edit-animation";

import { DieType } from "./DieType";

function getFirstProfileDataSet(jsonData: Json.DataSet): DataSet {
  const defaultProfileAppDataSet = loadAppDataSet(jsonData);
  return createDataSetForProfile(
    defaultProfileAppDataSet.profiles[0],
    defaultProfileAppDataSet.defaultProfile
  ).toDataSet();
}

export default function (dieType: DieType): DataSet {
  // Update the project tsconfig.json after adding a new profile JSON file to the build
  switch (dieType) {
    case "d20":
    default:
      return getFirstProfileDataSet(
        require(`!/profiles/default-profile-d20.json`)
      );
  }
}
