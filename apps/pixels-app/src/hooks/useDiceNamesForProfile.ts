import React from "react";

import { useAppSelector } from "~/app/hooks";

export function useDiceNamesForProfile(profileUuid: string) {
  const profiles = useAppSelector((state) => state.library.profiles);
  const pairedDice = useAppSelector((state) => state.pairedDice.paired);
  return React.useMemo(() => {
    const diceProfiles = profiles.ids.filter(
      (uuid) => profiles.entities[uuid]?.sourceUuid === profileUuid
    );
    return pairedDice
      .filter((d) => diceProfiles.includes(d.profileUuid))
      .map((d) => d.name);
  }, [pairedDice, profileUuid, profiles]);
}
