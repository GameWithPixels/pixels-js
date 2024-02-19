import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { useAppSelector } from "~/app/hooks";
import { readAnimation } from "~/features/store/profiles";

export function useAnimationsList(): Readonly<Profiles.Animation>[] {
  const library = useAppSelector((state) => state.library);
  return React.useMemo(
    () =>
      Object.values(library.animations)
        .flatMap((v) => v.ids)
        .map((uuid) => readAnimation(uuid, library)),
    [library]
  );
}
