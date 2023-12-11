import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { useAppSelector } from "~/app/hooks";
import { readPattern } from "~/features/store/patterns";

export function usePatternsList(): Readonly<Profiles.Pattern>[] {
  const library = useAppSelector((state) => state.profilesLibrary);
  return React.useMemo(
    () => library.patterns.map((p) => readPattern(p.uuid, library)),
    [library]
  );
}
