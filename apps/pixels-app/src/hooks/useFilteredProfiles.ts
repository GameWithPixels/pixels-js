import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { getCompatibleDiceTypes } from "~/features/profiles";

export function useFilteredProfiles(
  profiles: Readonly<Profiles.Profile>[],
  filter: string,
  dieType?: PixelDieType
): Readonly<Profiles.Profile>[] {
  return React.useMemo(() => {
    const compatDiceTypes = getCompatibleDiceTypes(dieType);
    const filterLower = filter.length ? filter.toLowerCase() : undefined;
    return !filterLower && !dieType
      ? profiles
      : profiles.filter(
          (p) =>
            (dieType &&
              (!compatDiceTypes.length ||
                compatDiceTypes.includes(p.dieType))) ??
            (filterLower &&
              (p.dieType.toLowerCase().includes(filterLower) ||
                p.name.toLowerCase().includes(filterLower) ||
                p.description.toLowerCase().includes(filterLower)))
        );
  }, [dieType, filter, profiles]);
}
