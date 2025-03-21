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
    reset(_, { payload: { patterns } }: PayloadAction<LibraryData>) {
      const state = patternsAdapter.getInitialState();
      logWrite("reset", "pattern", "count=" + patterns.length);
      return patternsAdapter.addMany(state, patterns);
    },

    add(state, { payload: pattern }: PayloadAction<PatternData>) {
      patternsAdapter.addOne(state, pattern);
      logWrite("add", "pattern", pattern.uuid, pattern.name);
    },

    update(state, { payload: pattern }: PayloadAction<PatternData>) {
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

    remove(state, { payload: uuid }: PayloadAction<string>) {
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
