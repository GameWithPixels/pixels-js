import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";
import { Serializable } from "@systemic-games/react-native-pixels-connect";

import { LibraryData } from "../LibraryData";
import { log } from "../log";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

export type AnimationsState<T extends Serializable.AnimationData> =
  EntityState<T>;

export const animationsAdapter = createEntityAdapter({
  selectId: (anim: Serializable.AnimationData) => anim.uuid,
});

export function createSliceGenerator<T extends Serializable.AnimationData>(
  name: keyof Serializable.AnimationSetData
) {
  return createSlice({
    name,
    initialState: animationsAdapter.getInitialState() as AnimationsState<T>,
    reducers: {
      reset(_, action: PayloadAction<LibraryData>) {
        const state = animationsAdapter.getInitialState();
        const animations = action.payload.animations[name];
        log("reset", "animation", `type=${name}, count=${animations.length}`);
        return animationsAdapter.addMany(
          state,
          animations
        ) as AnimationsState<T>;
      },

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      add(state, action: PayloadAction<T>) {
        // const data = action.payload;
        // const anims = state.animations[type];
        // assert(anims);
        // // @ts-ignore Trust that we're getting the proper data
        // anims.push(data);
        // log("add", "animation", data.uuid);
        throw new Error("Not implemented");
      },

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      update(state, action: PayloadAction<T>) {
        // const { type, data } = action.payload;
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
        throw new Error("Not implemented");
      },

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      remove(state, action: PayloadAction<string>) {
        // const uuid = action.payload;
        // Find the animation in our data
        // const animEntry = findAnimation(uuid, state.animations);
        // if (animEntry) {
        //   animEntry.animations.splice(animEntry.index, 1);
        //   storeWriteLog("remove", "animation", uuid);
        // } else {
        //   console.warn(`Redux: No animation with uuid ${uuid} to remove`);
        // }
        throw new Error("Not implemented");
      },
    },
  });
}
