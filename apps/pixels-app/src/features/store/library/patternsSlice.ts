import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";
import { Serializable } from "@systemic-games/react-native-pixels-connect";

import { logWrite } from "./logWrite";
import { LibraryData } from "./types";

type PatternData = Serializable.PatternData;

export type PatternsState = EntityState<Serializable.PatternData>;

export const patternsAdapter = createEntityAdapter({
  selectId: (pattern: Readonly<PatternData>) => pattern.uuid,
});

const patternsSlice = createSlice({
  name: "patterns",
  initialState: patternsAdapter.getInitialState,
  reducers: {
    reset(_, action: PayloadAction<LibraryData>) {
      const state = patternsAdapter.getInitialState();
      logWrite("reset", "pattern", "count=" + action.payload.patterns.length);
      return patternsAdapter.addMany(state, action.payload.patterns);
    },

    add(state, action: PayloadAction<PatternData>) {
      const pattern = action.payload;
      patternsAdapter.addOne(state, pattern);
      logWrite("add", "pattern", pattern.uuid, pattern.name);
    },

    update(state, action: PayloadAction<PatternData>) {
      const pattern = action.payload;
      patternsAdapter.setOne(state, pattern);
      logWrite("update", "pattern", pattern.uuid, pattern.name);
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
      logWrite("remove", "pattern", uuid);
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
