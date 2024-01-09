import { combineReducers } from "@reduxjs/toolkit";

import animations from "~/features/store/library/animations/reducer";
import gradients from "~/features/store/library/gradientsSlice";
import patterns from "~/features/store/library/patternsSlice";
import profiles from "~/features/store/library/profilesSlice";
import templates from "~/features/store/library/templatesSlice";

export default combineReducers({
  profiles,
  templates,
  animations,
  patterns,
  gradients,
});
