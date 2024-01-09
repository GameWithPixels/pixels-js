import { Serializable } from "@systemic-games/react-native-pixels-connect";

import { AnimationsState, createSliceGenerator } from "./createSliceGenerator";

export type AnimationsPatternState =
  AnimationsState<Serializable.AnimationPatternData>;

const patternsSlice =
  createSliceGenerator<Serializable.AnimationPatternData>("pattern");

export const { reset, add, update, remove } = patternsSlice.actions;

export default patternsSlice.reducer;
