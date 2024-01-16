import { Serializable } from "@systemic-games/react-native-pixels-connect";

import { AnimationsState, createSliceGenerator } from "./createSliceGenerator";

export type AnimationsCycleState =
  AnimationsState<Serializable.AnimationCycleData>;

const cycleSlice =
  createSliceGenerator<Serializable.AnimationCycleData>("cycle");

export const { reset, add, update, remove } = cycleSlice.actions;

export default cycleSlice.reducer;
