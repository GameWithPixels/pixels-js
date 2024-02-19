import { Serializable } from "@systemic-games/react-native-pixels-connect";

import { AnimationsState, createSliceGenerator } from "./createSliceGenerator";

export type AnimationsSequenceState =
  AnimationsState<Serializable.AnimationSequenceData>;

const sequenceSlice =
  createSliceGenerator<Serializable.AnimationSequenceData>("sequence");

export const { reset, add, update, remove } = sequenceSlice.actions;

export default sequenceSlice.reducer;
