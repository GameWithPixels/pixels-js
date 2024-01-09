import { Serializable } from "@systemic-games/react-native-pixels-connect";

import { AnimationsState, createSliceGenerator } from "./createSliceGenerator";

export type AnimationsGradientPatternState =
  AnimationsState<Serializable.AnimationGradientPatternData>;

const gradientPatternSlice =
  createSliceGenerator<Serializable.AnimationGradientPatternData>(
    "gradientPattern"
  );

export const { reset, add, update, remove } = gradientPatternSlice.actions;

export default gradientPatternSlice.reducer;
