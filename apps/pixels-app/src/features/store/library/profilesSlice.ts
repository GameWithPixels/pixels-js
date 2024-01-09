import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";
import { Serializable } from "@systemic-games/react-native-pixels-connect";

import { log } from "./log";

export type ProfilesState = EntityState<Serializable.ProfileData>;

export const profilesAdapter = createEntityAdapter({
  selectId: (profile: Serializable.ProfileData) => profile.uuid,
});

const profilesSlice = createSlice({
  name: "profiles",
  initialState: profilesAdapter.getInitialState(),
  reducers: {
    reset(_, _action: PayloadAction<Serializable.LibraryData>) {
      return profilesAdapter.getInitialState();
    },

    add(state, action: PayloadAction<Serializable.ProfileData>) {
      const profile = action.payload;
      profilesAdapter.addOne(state, profile);
      log("add", "profile", profile.uuid, profile.name);
    },

    update(state, action: PayloadAction<Serializable.ProfileData>) {
      const profile = action.payload;
      profilesAdapter.setOne(state, profile);
      log("update", "profile", profile.uuid, profile.name);
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
      log("remove", "profile", uuid);
      // const index = state.profiles.findIndex((p) => p.uuid === uuid);
      // if (index >= 0) {
      //   state.profiles.splice(index, 1);
      // } else {
      //   console.warn(`Redux: No profile with uuid ${uuid} to remove`);
      // }
    },

    setHash(state, action: PayloadAction<{ uuid: string; hash: number }>) {
      const { uuid, hash } = action.payload;
      profilesAdapter.updateOne(state, {
        id: uuid,
        changes: { hash },
      });
      log("update", "profile", uuid, "hash");
      // const profile = state.profiles.find((p) => p.uuid === uuid);
      // if (profile) {
      //   profile.hash = hash;
      // } else {
      //   console.warn(`Redux: No profile with uuid ${uuid} for setting hash`);
      // }
    },
  },
});

export const { reset, add, update, remove, setHash } = profilesSlice.actions;

export default profilesSlice.reducer;
