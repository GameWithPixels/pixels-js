import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";

export function useFilteredProfiles(
  profiles: Readonly<Profiles.Profile>[],
  filter: string,
  group: string
): Readonly<Profiles.Profile>[] {
  return React.useMemo(() => {
    const filterLower = filter.length ? filter.toLowerCase() : undefined;
    const groupLower = group.length ? group.toLowerCase() : undefined;
    return !groupLower && !filterLower
      ? profiles
      : profiles.filter(
          (p) =>
            (!groupLower || p.group.toLowerCase() === groupLower) &&
            (!filterLower ||
              p.name.toLowerCase().includes(filterLower) ||
              p.description.toLowerCase().includes(filterLower) ||
              p.dieType.toLowerCase().includes(filterLower))
        );
  }, [group, filter, profiles]);
}
