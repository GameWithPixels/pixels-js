import { Serializable } from "@systemic-games/react-native-pixels-connect";

import { AnimationsState, createSliceGenerator } from "./createSliceGenerator";

export type AnimationsNoiseState =
  AnimationsState<Serializable.AnimationNoiseData>;

const noiseSlice =
  createSliceGenerator<Serializable.AnimationNoiseData>("noise");

export const { reset, add, update, remove } = noiseSlice.actions;

export default noiseSlice.reducer;
