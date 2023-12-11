import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { assert } from "@systemic-games/pixels-core-utils";
import { Serializable } from "@systemic-games/pixels-edit-animation";

import StandardProfilesJson from "#/profiles/standard-profiles.json";
import { jsonConvert } from "~/features/jsonConvert";

// eslint-disable-next-line import/namespace
export interface LibraryState extends Serializable.LibraryData {}

let _initialState: Serializable.LibraryData;

function getInitialState(): LibraryState {
  if (!_initialState) {
    _initialState = jsonConvert(StandardProfilesJson);
  }
  return _initialState;
}

function storeLog(
  action:
    | "addProfile"
    | "updateProfile"
    | "removeProfile"
    | "addAnimation"
    | "updateAnimation"
    | "removeAnimation"
    | "addPattern"
    | "updatePattern"
    | "removePattern"
    | "addGradient"
    | "updateGradient"
    | "removeGradient",
  uuid: string,
  name?: string
) {
  console.log(`TO-STORE ${action} ${uuid} ${name ?? ""}`);
}

function findAnimation(
  uuid: string,
  animations: Serializable.AnimationSetData
):
  | {
      animations: Serializable.AnimationData[];
      index: number;
      type: keyof Serializable.AnimationSetData;
    }
  | undefined {
  // Get all animation arrays
  const animArrays = Object.entries(animations).filter(Array.isArray);
  // And search for our animation
  let arrayIndex = 0,
    animIndex = -1;
  while (arrayIndex < animArrays.length) {
    const entry = animArrays[arrayIndex];
    animIndex = entry[1].findIndex(
      (kv: Serializable.AnimationData) => kv.uuid === uuid
    );
    if (animIndex >= 0) {
      return {
        animations: entry[1],
        index: animIndex,
        type: entry[0] as keyof Serializable.AnimationSetData,
      };
    }
    ++arrayIndex;
  }
}

function insert<T extends Serializable.UniqueData>(
  value: T,
  array: T[],
  afterUuid?: string
) {
  if (afterUuid) {
    const index = array.findIndex((d) => d.uuid === afterUuid);
    if (index < 0) {
      console.warn(
        `Redux: Could not find data with uuid ${afterUuid} to insert new value after it`
      );
    }
    array.splice(index + 1, 0, value);
  } else {
    array.push(value);
  }
}

// Redux slice that stores the list of profiles, animations, patterns and gradients
const profilesLibrarySlice = createSlice({
  name: "profilesLibrary",
  initialState: getInitialState, // TODO avoid loading default state if getting data from rehydration
  reducers: {
    resetProfilesToDefault() {
      return getInitialState();
    },

    //
    // Profiles
    //

    addProfile(
      state,
      action: PayloadAction<{
        profile: Serializable.ProfileData;
        afterUuid?: string;
      }>
    ) {
      const { profile, afterUuid } = action.payload;
      insert(profile, state.profiles, afterUuid);
      storeLog("addProfile", profile.uuid, profile.name);
    },

    updateProfile(state, action: PayloadAction<Serializable.ProfileData>) {
      const profile = action.payload;
      const index = state.profiles.findIndex((p) => p.uuid === profile.uuid);
      if (index >= 0) {
        state.profiles[index] = profile;
      } else {
        console.warn(`Redux: No profile with uuid ${profile.uuid} to update`);
      }
      storeLog("updateProfile", profile.uuid, profile.name);
    },

    removeProfile(state, action: PayloadAction<string>) {
      const uuid = action.payload;
      const index = state.profiles.findIndex((p) => p.uuid === uuid);
      if (index >= 0) {
        state.profiles.splice(index, 1);
      } else {
        console.warn(`Redux: No profile with uuid ${uuid} to remove`);
      }
      storeLog("removeProfile", uuid);
    },

    //
    // Animations
    //

    addAnimation(
      state,
      action: PayloadAction<{
        type: keyof Serializable.AnimationSetData;
        data: Serializable.AnimationData;
        afterUuid: string | undefined;
      }>
    ) {
      const { type, data } = action.payload;
      const anims = state.animations[type];
      assert(anims);
      // @ts-ignore Trust that we're getting the proper data
      anims.push(data);
      storeLog("addAnimation", data.uuid);
    },

    updateAnimation(
      state,
      action: PayloadAction<{
        type: keyof Serializable.AnimationSetData;
        data: Serializable.AnimationData;
      }>
    ) {
      const { type, data } = action.payload;
      const anims = state.animations[type];
      assert(anims);
      // Find the animation in our data
      const animEntry = findAnimation(data.uuid, state.animations);
      if (animEntry) {
        const changedType = animEntry.type !== type;
        if (changedType) {
          animEntry.animations.splice(animEntry.index, 1);
          // @ts-ignore Trust that we're getting the proper data
          anims.push(data);
        } else {
          // @ts-ignore Trust that we're getting the proper data
          anims[animEntry.index] = data;
        }
        storeLog("updateAnimation", data.uuid);
      } else {
        console.warn(`Redux: No animation with uuid ${data.uuid} to update`);
      }
    },

    removeAnimation(state, action: PayloadAction<string>) {
      const uuid = action.payload;
      // Find the animation in our data
      const animEntry = findAnimation(uuid, state.animations);
      if (animEntry) {
        animEntry.animations.splice(animEntry.index, 1);
        storeLog("removeAnimation", uuid);
      } else {
        console.warn(`Redux: No animation with uuid ${uuid} to remove`);
      }
    },

    //
    // Patterns
    //

    addPattern(
      state,
      action: PayloadAction<{
        pattern: Serializable.PatternData;
        afterUuid: string | undefined;
      }>
    ) {
      const { pattern, afterUuid } = action.payload;
      insert(pattern, state.patterns, afterUuid);
      storeLog("addPattern", pattern.uuid);
    },

    updatePattern(state, action: PayloadAction<Serializable.PatternData>) {
      const pattern = action.payload;
      const index = state.patterns.findIndex((p) => p.uuid === pattern.uuid);
      if (index >= 0) {
        state.patterns[index] = pattern;
        storeLog("updatePattern", pattern.uuid);
      } else {
        console.warn(`Redux: No pattern with uuid ${pattern.uuid} to update`);
      }
    },

    removePattern(state, action: PayloadAction<string>) {
      const uuid = action.payload;
      const index = state.patterns.findIndex((p) => p.uuid === uuid);
      if (index >= 0) {
        state.patterns.splice(index, 1);
        storeLog("removePattern", uuid);
      } else {
        console.warn(`Redux: No pattern with uuid ${uuid} to remove`);
      }
    },

    //
    // Gradients
    //

    addGradient(
      state,
      action: PayloadAction<{
        gradient: Serializable.GradientData;
        afterUuid: string | undefined;
      }>
    ) {
      const { gradient, afterUuid } = action.payload;
      insert(gradient, state.gradients, afterUuid);
      storeLog("addGradient", gradient.uuid);
    },

    updateGradient(state, action: PayloadAction<Serializable.GradientData>) {
      const gradient = action.payload;
      const index = state.patterns.findIndex((p) => p.uuid === gradient.uuid);
      if (index >= 0) {
        state.gradients[index] = gradient;
        storeLog("updateGradient", gradient.uuid);
      } else {
        console.warn(`Redux: No gradient with uuid ${gradient.uuid} to update`);
      }
    },

    removeGradient(state, action: PayloadAction<string>) {
      const uuid = action.payload;
      const index = state.patterns.findIndex((p) => p.uuid === uuid);
      if (index >= 0) {
        state.patterns.splice(index, 1);
        storeLog("removeGradient", uuid);
      } else {
        console.warn(`Redux: Redux: No gradient with uuid ${uuid} to remove`);
      }
    },
  },
});

export const {
  resetProfilesToDefault,
  addProfile,
  updateProfile,
  removeProfile,
  addAnimation,
  updateAnimation,
  removeAnimation,
  addPattern,
  updatePattern,
  removePattern,
  addGradient,
  updateGradient,
  removeGradient,
} = profilesLibrarySlice.actions;

export default profilesLibrarySlice.reducer;
