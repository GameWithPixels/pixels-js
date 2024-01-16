import { Serializable } from "@systemic-games/react-native-pixels-connect";

import { createDefault } from "./createDefault";
import * as Library from "./library";

import { AppDispatch, LibraryState } from "~/app/store";
import { createDefaultProfiles } from "~/features/profiles";

export function dispatchReset(appDispatch: AppDispatch): void {
  const library = createDefault();
  appDispatch(Library.Profiles.reset(library));
  appDispatch(Library.Templates.reset(library));
  appDispatch(Library.Animations.Cycle.reset(library));
  appDispatch(Library.Animations.Flashes.reset(library));
  appDispatch(Library.Animations.Rainbow.reset(library));
  appDispatch(Library.Animations.Pattern.reset(library));
  appDispatch(Library.Animations.GradientPattern.reset(library));
  appDispatch(Library.Animations.Gradient.reset(library));
  appDispatch(Library.Animations.Noise.reset(library));
  appDispatch(Library.Animations.Normals.reset(library));
  appDispatch(Library.Gradients.reset(library));
  appDispatch(Library.Patterns.reset(library));
}

export function dispatchAddDefaultProfiles(
  appDispatch: AppDispatch,
  library: LibraryState
): void {
  const { profiles, animations, gradients, patterns } = createDefaultProfiles(
    "d20",
    library
  );
  for (const gradient of gradients) {
    appDispatch(Library.Gradients.add(Serializable.fromGradient(gradient)));
  }
  for (const pattern of patterns) {
    appDispatch(Library.Patterns.add(Serializable.fromPattern(pattern)));
  }
  for (const animation of animations) {
    appDispatch(Library.Animations.add(Serializable.fromAnimation(animation)));
  }
  for (const profile of profiles) {
    appDispatch(Library.Profiles.add(Serializable.fromProfile(profile)));
  }
}
