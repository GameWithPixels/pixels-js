import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";
import { assert } from "@systemic-games/pixels-core-utils";

import { FileAsset } from "./types";
import { logWrite } from "../library/logWrite";

export type FileAssetsState = EntityState<FileAsset>;

export const imagesAdapter = createEntityAdapter({
  selectId: (ac: Readonly<FileAsset>) => ac.uuid,
});

const imagesSlice = createSlice({
  name: "images",
  initialState: imagesAdapter.getInitialState,
  reducers: {
    reset() {
      return imagesAdapter.getInitialState();
    },

    // Add only if new image
    add(state, action: PayloadAction<FileAsset>) {
      const image = action.payload;
      logWrite("add", "image", image.uuid, image.name);
      assert(image.uuid.length, "FileAsset must have a uuid");
      imagesAdapter.addOne(state, image);
    },

    // Remove existing image
    remove(state, action: PayloadAction<string>) {
      const uuid = action.payload;
      logWrite("remove", "image", uuid);
      imagesAdapter.removeOne(state, uuid);
    },
  },
});

export const { reset, add, remove } = imagesSlice.actions;

export default imagesSlice.reducer;
