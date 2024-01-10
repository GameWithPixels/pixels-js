import { Serializable } from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { useAppSelector, useAppDispatch } from "~/app/hooks";
import { createDefaultProfiles } from "~/features/profiles";
import { Library } from "~/features/store";

// TODO show splash screen until library is loaded
export function LoadDefaultLibrary() {
  const hasTemplates = useAppSelector(
    (state) => state.library.templates.ids.length > 0
  );
  const library = useAppSelector((state) => state.library);
  const appDispatch = useAppDispatch();
  React.useEffect(() => {
    if (!hasTemplates) {
      Library.dispatchReset(appDispatch);
    } else if (!library.profiles.ids.length) {
      console.log("!!! Creating default profiles !!!");
      const { profiles, animations, gradients, patterns } =
        createDefaultProfiles("d20", library);
      for (const gradient of gradients) {
        appDispatch(Library.Gradients.add(Serializable.fromGradient(gradient)));
      }
      for (const pattern of patterns) {
        appDispatch(Library.Patterns.add(Serializable.fromPattern(pattern)));
      }
      for (const animation of animations) {
        appDispatch(
          Library.Animations.add(Serializable.fromAnimation(animation))
        );
      }
      for (const profile of profiles) {
        appDispatch(Library.Profiles.add(Serializable.fromProfile(profile)));
      }
    }
  }, [appDispatch, hasTemplates, library]);
  return null;
}
