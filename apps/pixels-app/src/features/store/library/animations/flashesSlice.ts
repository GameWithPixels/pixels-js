import { Serializable } from "@systemic-games/react-native-pixels-connect";

import { AnimationsState, createSliceGenerator } from "./createSliceGenerator";

export type AnimationsFlashesState =
  AnimationsState<Serializable.AnimationFlashesData>;

const flashesSlice =
  createSliceGenerator<Serializable.AnimationFlashesData>("flashes");

export const { reset, add, update, remove } = flashesSlice.actions;

export default flashesSlice.reducer;
