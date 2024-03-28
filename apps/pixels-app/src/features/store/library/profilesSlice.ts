import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";
import { Serializable } from "@systemic-games/react-native-pixels-connect";

import { LibraryData } from "./LibraryData";
import { logWrite } from "./logWrite";

export type ProfilesState = EntityState<Serializable.ProfileData>;

export const profilesAdapter = createEntityAdapter({
  selectId: (profile: Serializable.ProfileData) => profile.uuid,
});

const profilesSlice = createSlice({
  name: "profiles",
  initialState: profilesAdapter.getInitialState(),
  reducers: {
    reset(_, action: PayloadAction<LibraryData>) {
      const state = profilesAdapter.getInitialState();
      logWrite("reset", "profile", "count=" + action.payload.profiles.length);
      return profilesAdapter.addMany(state, action.payload.profiles);
    },

    add(state, action: PayloadAction<Serializable.ProfileData>) {
      const profile = action.payload;
      profilesAdapter.addOne(state, profile);
      logWrite("add", "profile", profile.uuid, profile.name);
    },

    update(state, action: PayloadAction<Serializable.ProfileData>) {
      const profile = action.payload;
      profilesAdapter.setOne(state, profile);
      logWrite("update", "profile", profile.uuid, profile.name);
      // const index = state.profiles.findIndex((p) => p.uuid === profile.uuid);
      // if (index >= 0) {
      //   state.profiles[index] = profile;
      // } else {
      //   console.warn(`Redux: No profile with uuid ${profile.uuid} to update`);
      // }
    },

    remove(state, action: PayloadAction<string>) {
      const uuid = action.payload;
      profilesAdapter.removeOne(state, uuid);
      logWrite("remove", "profile", uuid);
      // const index = state.profiles.findIndex((p) => p.uuid === uuid);
      // if (index >= 0) {
      //   state.profiles.splice(index, 1);
      // } else {
      //   console.warn(`Redux: No profile with uuid ${uuid} to remove`);
      // }
    },
  },
});

export const { reset, add, update, remove } = profilesSlice.actions;

export default profilesSlice.reducer;
