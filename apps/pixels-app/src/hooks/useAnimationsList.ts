import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { useAppSelector } from "~/app/hooks";
import { readAnimation } from "~/features/store/animations";

export function useAnimationsList(): Readonly<Profiles.Animation>[] {
  const library = useAppSelector((state) => state.profilesLibrary);
  return React.useMemo(
    () =>
      Object.values(library.animations)
        .flat()
        .map((a: Profiles.Animation) => readAnimation(a.uuid, library)),
    [library]
  );
}
