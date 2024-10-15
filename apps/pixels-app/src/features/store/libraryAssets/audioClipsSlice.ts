import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";
import { assert } from "@systemic-games/pixels-core-utils";

import { AudioClipAsset } from "./types";
import { logWrite } from "../library/logWrite";

export type AudioClipAssetsState = EntityState<AudioClipAsset>;

export const audioClipsAdapter = createEntityAdapter({
  selectId: (ac: Readonly<AudioClipAsset>) => ac.uuid,
});

const audioClipsSlice = createSlice({
  name: "audioClips",
  initialState: audioClipsAdapter.getInitialState(),
  reducers: {
    reset() {
      return audioClipsAdapter.getInitialState();
    },

    // Add only if new clip
    add(state, action: PayloadAction<AudioClipAsset>) {
      console.log("ADD CLIP " + JSON.stringify(action.payload));
      const audioClip = action.payload;
      assert(audioClip.uuid.length, "AudioClipAsset must have a uuid");
      audioClipsAdapter.addOne(state, audioClip);
      logWrite("add", "audioClip", audioClip.uuid, audioClip.name);
      console.log("ADD CLIP OK");
    },

    // Remove existing clip
    remove(state, action: PayloadAction<string>) {
      const uuid = action.payload;
      audioClipsAdapter.removeOne(state, uuid);
      logWrite("remove", "audioClip", uuid);
    },
  },
});

export const { reset, add, remove } = audioClipsSlice.actions;

export default audioClipsSlice.reducer;
