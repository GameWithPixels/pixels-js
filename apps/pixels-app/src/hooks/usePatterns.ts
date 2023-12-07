import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { useAppSelector } from "~/app/hooks";
import { readPattern } from "~/features/store/patterns";

export function usePatterns(): {
  patterns: Profiles.Pattern[];
  addPattern: (pattern: Profiles.Pattern) => void;
  removePattern: (patternUuid: string) => void;
} {
  const library = useAppSelector((state) => state.profilesLibrary);
  const patterns = React.useMemo(
    () => library.patterns.map((p) => readPattern(p.uuid, library)),
    [library]
  );
  const addPattern = React.useCallback((pattern: Profiles.Pattern) => {
    throw new Error("addPattern not implemented");
  }, []);
  const removePattern = React.useCallback((patternUuid: string) => {
    throw new Error("removePattern not implemented");
  }, []);
  return { patterns, addPattern, removePattern };
}
