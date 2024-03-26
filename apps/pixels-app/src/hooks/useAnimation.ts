import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { useAppSelector } from "~/app/hooks";
import { readAnimation } from "~/features/store/profiles";

export function useAnimation(
  animationUuid: string
): Readonly<Profiles.Animation> {
  const library = useAppSelector((state) => state.library);
  return readAnimation(animationUuid, library);
}

// Returns an observable animation that is editable
export function useEditableAnimation(
  animationUuid: string
): Profiles.Animation {
  const library = useAppSelector((state) => state.library);
  return React.useMemo(
    () => readAnimation(animationUuid, library, true),
    [animationUuid, library]
  );
}
