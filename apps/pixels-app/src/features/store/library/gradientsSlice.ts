import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";
import { Serializable } from "@systemic-games/react-native-pixels-connect";

import { logWrite } from "./logWrite";
import { LibraryData } from "./types";

type GradientData = Serializable.GradientData;

export type GradientsState = EntityState<GradientData>;

export const gradientsAdapter = createEntityAdapter({
  selectId: (gradient: Readonly<GradientData>) => gradient.uuid,
});

const gradientsSlice = createSlice({
  name: "gradients",
  initialState: gradientsAdapter.getInitialState,
  reducers: {
    reset(_, { payload: { gradients } }: PayloadAction<LibraryData>) {
      const state = gradientsAdapter.getInitialState();
      logWrite("reset", "gradient", "count=" + gradients.length);
      return gradientsAdapter.addMany(state, gradients);
    },

    add(state, { payload: gradient }: PayloadAction<GradientData>) {
      gradientsAdapter.addOne(state, gradient);
      logWrite("add", "gradient", gradient.uuid);
    },

    update(state, { payload: gradient }: PayloadAction<GradientData>) {
      gradientsAdapter.setOne(state, gradient);
      logWrite("update", "gradient", gradient.uuid);
      // const index = state.patterns.findIndex((p) => p.uuid === gradient.uuid);
      // if (index >= 0) {
      //   state.gradients[index] = gradient;
      //   storeWriteLog("update", "gradient", gradient.uuid);
      // } else {
      //   console.warn(`Redux: No gradient with uuid ${gradient.uuid} to update`);
      // }
    },

    remove(state, { payload: uuid }: PayloadAction<string>) {
      gradientsAdapter.removeOne(state, uuid);
      logWrite("remove", "gradient", uuid);
      // const index = state.patterns.findIndex((p) => p.uuid === uuid);
      // if (index >= 0) {
      //   state.patterns.splice(index, 1);
      //   storeWriteLog("remove", "gradient", uuid);
      // } else {
      //   console.warn(`Redux: Redux: No gradient with uuid ${uuid} to remove`);
      // }
    },
  },
});

export const { reset, add, update, remove } = gradientsSlice.actions;

export default gradientsSlice.reducer;
