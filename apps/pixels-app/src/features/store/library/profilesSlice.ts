import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";
import { assert, unsigned32ToHex } from "@systemic-games/pixels-core-utils";

import { logWrite } from "./logWrite";
import { LibraryData, AppProfileData } from "./types";

export type ProfilesState = EntityState<AppProfileData>;

export const profilesAdapter = createEntityAdapter({
  selectId: (profile: Readonly<AppProfileData>) => profile.uuid,
});

const profilesSlice = createSlice({
  name: "profiles",
  initialState: profilesAdapter.getInitialState,
  reducers: {
    reset(_, action: PayloadAction<LibraryData>) {
      const state = profilesAdapter.getInitialState();
      logWrite("reset", "profile", "count=" + action.payload.profiles.length);
      return profilesAdapter.addMany(state, action.payload.profiles);
    },

    // Add only if new profile
    add(state, action: PayloadAction<AppProfileData>) {
      const profile = action.payload;
      assert(profile.uuid?.length, "Profile must have a uuid");
      profilesAdapter.addOne(state, profile);
      logWrite(
        "add",
        "profile",
        profile.uuid,
        `${profile.name}, hash=0x${unsigned32ToHex(profile.hash)}`
      );
    },

    // Add or update profile
    update(state, action: PayloadAction<AppProfileData>) {
      const profile = action.payload;
      assert(profile.uuid?.length, "Profile must have a uuid");
      profilesAdapter.setOne(state, profile);
      logWrite(
        "update",
        "profile",
        profile.uuid,
        `${profile.name}, hash=0x${unsigned32ToHex(profile.hash)}, src=${profile.sourceUuid}`
      );
    },

    // Remove existing profile
    remove(state, action: PayloadAction<string>) {
      const uuid = action.payload;
      profilesAdapter.removeOne(state, uuid);
      logWrite("remove", "profile", uuid);
    },
  },
});

export const { reset, add, update, remove } = profilesSlice.actions;

export default profilesSlice.reducer;
