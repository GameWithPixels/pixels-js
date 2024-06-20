import { createDefault } from "./createDefault";
import * as Library from "./library";

import { AppDispatch } from "~/app/store";
export function dispatchReset(
  appDispatch: AppDispatch,
  opt?: { keepProfiles?: boolean }
): void {
  const library = createDefault();
  if (!opt?.keepProfiles) {
    appDispatch(Library.Profiles.reset(library));
  }
  appDispatch(Library.Animations.Cycle.reset(library));
  appDispatch(Library.Animations.Flashes.reset(library));
  appDispatch(Library.Animations.Rainbow.reset(library));
  appDispatch(Library.Animations.Pattern.reset(library));
  appDispatch(Library.Animations.GradientPattern.reset(library));
  appDispatch(Library.Animations.Gradient.reset(library));
  appDispatch(Library.Animations.Noise.reset(library));
  appDispatch(Library.Animations.Normals.reset(library));
  appDispatch(Library.Animations.Sequence.reset(library));
  appDispatch(Library.Gradients.reset(library));
  appDispatch(Library.Patterns.reset(library));
}
