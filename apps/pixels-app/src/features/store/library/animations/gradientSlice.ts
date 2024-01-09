import { Serializable } from "@systemic-games/react-native-pixels-connect";

import { AnimationsState, createSliceGenerator } from "./createSliceGenerator";

export type AnimationsGradientState =
  AnimationsState<Serializable.AnimationGradientData>;

const gradientSlice =
  createSliceGenerator<Serializable.AnimationGradientData>("gradient");

export const { reset, add, update, remove } = gradientSlice.actions;

export default gradientSlice.reducer;
