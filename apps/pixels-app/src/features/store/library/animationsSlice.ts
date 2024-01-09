import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";
import { assert } from "@systemic-games/pixels-core-utils";
import { Serializable } from "@systemic-games/react-native-pixels-connect";

import { log } from "./log";

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

export type AnimationsState = EntityState<Serializable.AnimationData>;

export const animationsAdapter = createEntityAdapter({
  selectId: (anim: Serializable.AnimationData) => anim.uuid,
});

const animationsSlice = createSlice({
  name: "animations",
  initialState: animationsAdapter.getInitialState(),
  reducers: {
    reset(_, action: PayloadAction<Serializable.LibraryData>) {
      const state = animationsAdapter.getInitialState();
      // log("reset", "animation", "count=" + action.payload.animations.length);
      // return animationsAdapter.addMany(state, action.payload.animations);
    },

    add(
      state,
      action: PayloadAction<{
        type: keyof Serializable.AnimationSetData;
        data: Serializable.AnimationData;
        afterUuid: string | undefined;
      }>
    ) {
      const { type, data } = action.payload;
      // const anims = state.animations[type];
      // assert(anims);
      // // @ts-ignore Trust that we're getting the proper data
      // anims.push(data);
      log("add", "animation", data.uuid);
    },

    update(
      state,
      action: PayloadAction<{
        type: keyof Serializable.AnimationSetData;
        data: Serializable.AnimationData;
      }>
    ) {
      const { type, data } = action.payload;
      // const anims = state.animations[type];
      // assert(anims);
      // // Find the animation in our data
      // const animEntry = findAnimation(data.uuid, state.animations);
      // if (animEntry) {
      //   const changedType = animEntry.type !== type;
      //   if (changedType) {
      //     animEntry.animations.splice(animEntry.index, 1);
      //     // @ts-ignore Trust that we're getting the proper data
      //     anims.push(data);
      //   } else {
      //     // @ts-ignore Trust that we're getting the proper data
      //     anims[animEntry.index] = data;
      //   }
      //   storeWriteLog("update", "animation", data.uuid);
      // } else {
      //   console.warn(`Redux: No animation with uuid ${data.uuid} to update`);
      // }
    },

    remove(state, action: PayloadAction<string>) {
      const uuid = action.payload;
      // Find the animation in our data
      // const animEntry = findAnimation(uuid, state.animations);
      // if (animEntry) {
      //   animEntry.animations.splice(animEntry.index, 1);
      //   storeWriteLog("remove", "animation", uuid);
      // } else {
      //   console.warn(`Redux: No animation with uuid ${uuid} to remove`);
      // }
    },
  },
});

export const { reset, add, update, remove } = animationsSlice.actions;

export default animationsSlice.reducer;
