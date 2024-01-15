import { Serializable } from "@systemic-games/react-native-pixels-connect";

import * as Animations from "./animations";
import * as Gradients from "./gradientsSlice";
import { loadDefault } from "./loadDefault";
import * as Patterns from "./patternsSlice";
import * as Profiles from "./profilesSlice";
import * as Templates from "./templatesSlice";

import { AppDispatch, LibraryState } from "~/app/store";
import { createDefaultProfiles } from "~/features/profiles";
import { Library } from "~/features/store";

export function dispatchReset(appDispatch: AppDispatch): void {
  const library = loadDefault();
  appDispatch(Profiles.reset(library));
  appDispatch(Templates.reset(library));
  appDispatch(Animations.Flashes.reset(library));
  appDispatch(Animations.Rainbow.reset(library));
  appDispatch(Animations.Pattern.reset(library));
  appDispatch(Animations.GradientPattern.reset(library));
  appDispatch(Animations.Gradient.reset(library));
  appDispatch(Animations.Noise.reset(library));
  appDispatch(Gradients.reset(library));
  appDispatch(Patterns.reset(library));
}

export function createDefault(
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
