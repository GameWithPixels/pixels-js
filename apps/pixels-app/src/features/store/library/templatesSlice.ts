import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";
import { Serializable } from "@systemic-games/react-native-pixels-connect";

import { LibraryData } from "./LibraryData";
import { log } from "./log";

export type TemplatesState = EntityState<Serializable.ProfileData>;

export const templatesAdapter = createEntityAdapter({
  selectId: (profile: Serializable.ProfileData) => profile.uuid,
});

const templatesSlice = createSlice({
  name: "templates",
  initialState: templatesAdapter.getInitialState(),
  reducers: {
    reset(_, action: PayloadAction<LibraryData>) {
      const state = templatesAdapter.getInitialState();
      log("reset", "template", "count=" + action.payload.templates.length);
      return templatesAdapter.addMany(state, action.payload.templates);
    },
  },
});

export const { reset } = templatesSlice.actions;

export default templatesSlice.reducer;
