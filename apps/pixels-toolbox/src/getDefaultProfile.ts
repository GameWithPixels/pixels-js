import {
  DataSet,
  Json,
  loadAppDataSet,
} from "@systemic-games/pixels-edit-animation";

import { DieType } from "./features/pixels/DieType";

function getFirstProfileDataSet(jsonData: Json.DataSet) {
  const defaultProfileAppDataSet = loadAppDataSet(jsonData);
  return defaultProfileAppDataSet
    .extractForProfile(defaultProfileAppDataSet.profiles[0])
    .toDataSet();
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
