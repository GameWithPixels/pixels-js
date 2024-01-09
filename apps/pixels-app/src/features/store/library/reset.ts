import * as Animations from "./animationsSlice";
import * as Gradients from "./gradientsSlice";
import * as Patterns from "./patternsSlice";
import * as Profiles from "./profilesSlice";
import * as Templates from "./templatesSlice";
import { loadDefault } from "./loadDefault";

import { AppDispatch } from "~/app/store";

export function dispatchReset(appDispatch: AppDispatch): void {
  const library = loadDefault();
  appDispatch(Patterns.reset(library));
  appDispatch(Gradients.reset(library));
  appDispatch(Animations.reset(library));
  appDispatch(Profiles.reset(library));
  appDispatch(Templates.reset(library));
}
