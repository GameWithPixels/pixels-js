import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { useAppSelector } from "~/app/hooks";
import { store } from "~/app/store";
import { readAnimation } from "~/features/store/profiles";

export function useAnimation(
  animationUuid: string
): Readonly<Profiles.Animation> {
  const library = useAppSelector((state) => state.profilesLibrary);
  return readAnimation(animationUuid, library);
}

export function useEditableAnimation(
  animationUuid: string
): Profiles.Animation {
  return React.useMemo(
    () => readAnimation(animationUuid, store.getState().profilesLibrary, true),
    [animationUuid]
  );
}
