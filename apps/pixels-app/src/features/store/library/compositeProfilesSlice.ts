import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";
import { assert } from "@systemic-games/pixels-core-utils";
import { Serializable } from "@systemic-games/react-native-pixels-connect";

import { logWrite } from "./logWrite";
import { LibraryData } from "./types";

type CompositeProfileData = Serializable.CompositeProfileData;

export type CompositeProfilesState = EntityState<CompositeProfileData>;

export const compositeProfilesAdapter = createEntityAdapter({
  selectId: (profile: Readonly<CompositeProfileData>) => profile.uuid,
});

const compositeProfilesSlice = createSlice({
  name: "compositeProfiles",
  initialState: compositeProfilesAdapter.getInitialState(),
  reducers: {
    reset(_, action: PayloadAction<LibraryData>) {
      const state = compositeProfilesAdapter.getInitialState();
      logWrite(
        "reset",
        "compositeProfile",
        "count=" + action.payload.compositeProfiles.length
      );
      return compositeProfilesAdapter.addMany(
        state,
        action.payload.compositeProfiles
      );
    },

    // Add only if new profile
    add(state, action: PayloadAction<CompositeProfileData>) {
      const profile = action.payload;
      assert(profile.uuid?.length, "Profile must have a uuid");
      compositeProfilesAdapter.addOne(state, profile);
      logWrite("add", "compositeProfile", profile.uuid, profile.name);
    },

    // Add or update profile
    update(state, action: PayloadAction<CompositeProfileData>) {
      const profile = action.payload;
      assert(profile.uuid?.length, "Profile must have a uuid");
      compositeProfilesAdapter.setOne(state, profile);
      logWrite("update", "compositeProfile", profile.uuid, profile.name);
    },

    // Remove existing profile
    remove(state, action: PayloadAction<string>) {
      const uuid = action.payload;
      compositeProfilesAdapter.removeOne(state, uuid);
      logWrite("remove", "compositeProfile", uuid);
    },
  },
});

export const { reset, add, update, remove } = compositeProfilesSlice.actions;

export default compositeProfilesSlice.reducer;
