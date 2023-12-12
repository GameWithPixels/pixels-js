import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";

export function useRolledConditionFaces(condition: Profiles.ConditionRolled) {
  return React.useMemo(
    () => condition.getFaceList(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [condition.face]
  ); // TODO until we have the face list as a property
}
