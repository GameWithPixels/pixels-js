import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";
import { Serializable } from "@systemic-games/react-native-pixels-connect";

import { LibraryData } from "./LibraryData";
import { log } from "./log";

export type PatternsState = EntityState<Serializable.PatternData>;

export const patternsAdapter = createEntityAdapter({
  selectId: (pattern: Serializable.PatternData) => pattern.uuid,
});

const patternsSlice = createSlice({
  name: "patterns",
  initialState: patternsAdapter.getInitialState(),
  reducers: {
    reset(_, action: PayloadAction<LibraryData>) {
      const state = patternsAdapter.getInitialState();
      log("reset", "pattern", "count=" + action.payload.patterns.length);
      return patternsAdapter.addMany(state, action.payload.patterns);
    },

    add(state, action: PayloadAction<Serializable.PatternData>) {
      const pattern = action.payload;
      patternsAdapter.addOne(state, pattern);
      log("add", "pattern", pattern.uuid, pattern.name);
    },

    update(state, action: PayloadAction<Serializable.PatternData>) {
      const pattern = action.payload;
      patternsAdapter.setOne(state, pattern);
      log("update", "pattern", pattern.uuid, pattern.name);
      // const index = state.patterns.findIndex((p) => p.uuid === pattern.uuid);
      // if (index >= 0) {
      //   state.patterns[index] = pattern;
      //   storeWriteLog("update", "pattern", pattern.uuid);
      // } else {
      //   console.warn(`Redux: No pattern with uuid ${pattern.uuid} to update`);
      // }
    },

    remove(state, action: PayloadAction<string>) {
      const uuid = action.payload;
      patternsAdapter.removeOne(state, uuid);
      log("remove", "pattern", uuid);
      // const index = state.patterns.findIndex((p) => p.uuid === uuid);
      // if (index >= 0) {
      //   state.patterns.splice(index, 1);
      //   storeWriteLog("remove", "pattern", uuid);
      // } else {
      //   console.warn(`Redux: No pattern with uuid ${uuid} to remove`);
      // }
    },
  },
});

export const { reset, add, update, remove } = patternsSlice.actions;

export default patternsSlice.reducer;
