import { Serializable } from "@systemic-games/react-native-pixels-connect";

import { AnimationsState, createSliceGenerator } from "./createSliceGenerator";

export type AnimationsNormalsState =
  AnimationsState<Serializable.AnimationNormalsData>;

const normalsSlice =
  createSliceGenerator<Serializable.AnimationNormalsData>("normals");

export const { reset, add, update, remove } = normalsSlice.actions;

export default normalsSlice.reducer;
