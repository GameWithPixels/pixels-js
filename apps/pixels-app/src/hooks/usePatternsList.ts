import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { useAppSelector } from "~/app/hooks";
import { readPattern } from "~/features/store/profiles";

export function usePatternsList(): Readonly<Profiles.Pattern>[] {
  const library = useAppSelector((state) => state.library);
  return React.useMemo(
    () =>
      library.patterns.ids.map((uuid) => readPattern(uuid as string, library)),
    [library]
  );
}
