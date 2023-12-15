import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { computed } from "mobx";
import React from "react";

// TODO until we have the face list as a property
export function useRolledConditionFaces(
  condition: Profiles.ConditionRolled
): number[] | "all" {
  return React.useMemo(
    () => computed(() => condition.getFaceList()),
    [condition]
  ).get();
}
