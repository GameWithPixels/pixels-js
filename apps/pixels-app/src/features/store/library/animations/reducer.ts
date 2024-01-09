import { combineReducers } from "@reduxjs/toolkit";

import flashes from "./flashesSlice";
import gradientPattern from "./gradientPatternSlice";
import gradient from "./gradientSlice";
import noise from "./noiseSlice";
import pattern from "./patternSlice";
import rainbow from "./rainbowSlice";

export default combineReducers({
  flashes,
  gradientPattern,
  gradient,
  noise,
  pattern,
  rainbow,
});
