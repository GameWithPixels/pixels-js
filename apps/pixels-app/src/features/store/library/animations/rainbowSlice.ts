import { Serializable } from "@systemic-games/react-native-pixels-connect";

import { AnimationsState, createSliceGenerator } from "./createSliceGenerator";

export type AnimationsRainbowState =
  AnimationsState<Serializable.AnimationRainbowData>;

const rainbowSlice =
  createSliceGenerator<Serializable.AnimationRainbowData>("rainbow");

export const { reset, add, update, remove } = rainbowSlice.actions;

export default rainbowSlice.reducer;
