import * as Animations from "./animations";
import * as Gradients from "./gradientsSlice";
import { loadDefault } from "./loadDefault";
import * as Patterns from "./patternsSlice";
import * as Profiles from "./profilesSlice";
import * as Templates from "./templatesSlice";

import { AppDispatch } from "~/app/store";

export function dispatchReset(appDispatch: AppDispatch): void {
  const library = loadDefault();
  appDispatch(Patterns.reset(library));
  appDispatch(Gradients.reset(library));
  appDispatch(Animations.Flashes.reset(library));
  appDispatch(Animations.Rainbow.reset(library));
  appDispatch(Animations.Pattern.reset(library));
  appDispatch(Animations.GradientPattern.reset(library));
  appDispatch(Animations.Gradient.reset(library));
  appDispatch(Animations.Noise.reset(library));
  appDispatch(Templates.reset(library));
  appDispatch(Profiles.reset(library));
}
