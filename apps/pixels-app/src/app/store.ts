import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Action,
  combineReducers,
  configureStore,
  Reducer,
  ThunkAction,
} from "@reduxjs/toolkit";
import { Serializable } from "@systemic-games/react-native-pixels-connect";
import {
  createMigrate,
  FLUSH,
  PAUSE,
  PERSIST,
  PersistedState,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from "redux-persist";

import appSettingsReducer from "~/features/store/appSettingsSlice";
import appUpdateReducer from "~/features/store/appUpdateSlice";
import diceRollsReducer from "~/features/store/diceRollsSlice";
import animationsCycleReducer from "~/features/store/library/animations/cycleSlice";
import animationsFlashesReducer from "~/features/store/library/animations/flashesSlice";
import animationsGradientPatternReducer from "~/features/store/library/animations/gradientPatternSlice";
import animationsGradientReducer from "~/features/store/library/animations/gradientSlice";
import animationsNoiseReducer from "~/features/store/library/animations/noiseSlice";
import animationsNormalsReducer from "~/features/store/library/animations/normalsSlice";
import animationsPatternReducer from "~/features/store/library/animations/patternSlice";
import animationsRainbowReducer from "~/features/store/library/animations/rainbowSlice";
import animationsSequenceReducer from "~/features/store/library/animations/sequenceSlice";
import gradientsReducer, {
  gradientsAdapter,
} from "~/features/store/library/gradientsSlice";
import patternsReducer, {
  patternsAdapter,
} from "~/features/store/library/patternsSlice";
import profilesReducer, {
  profilesAdapter,
} from "~/features/store/library/profilesSlice";
import pairedDiceReducer from "~/features/store/pairedDiceSlice";
import { getTimeStringMs } from "~/features/utils";

const MyStorage = !__DEV__
  ? AsyncStorage
  : {
      setItem: (key: string, value: string) => {
        console.log(`[${getTimeStringMs()}] AsyncStorage Write => ${key}`);
        return AsyncStorage.setItem(key, value);
      },
      getItem: (key: string) => {
        console.log(`[${getTimeStringMs()}] AsyncStorage Read => ${key}`);
        return AsyncStorage.getItem(key);
      },
      removeItem: (key: string) => {
        console.log(`[${getTimeStringMs()}] AsyncStorage Delete => ${key}`);
        return AsyncStorage.removeItem(key);
      },
    };

const migrations = {
  2: (state: PersistedState) => {
    if (state?._persist?.version === 1) {
      console.warn("Migrating from version 1 to 2: Clearing state");
      return { _persist: state._persist };
    }
    return state;
  },
  3: (state: PersistedState) => {
    const ver = state?._persist?.version;
    if (ver) {
      switch (ver) {
        case 1:
          console.warn("Migrating from version 1 to 3: Clearing state");
          return { _persist: state._persist };
        case 2: {
          const animId = "8c677768-975f-4544-b3ce-a219f68b9a79"; // Rainbow Waterfall Overlap
          if ("ids" in state && Array.isArray(state.ids)) {
            const animIndex = state.ids.indexOf(animId);
            if (animIndex >= 0) {
              console.warn(
                "Migrating from version 2 to 3: Removing Rainbow Waterfall Overlap"
              );
              const animState = state as unknown as ReturnType<
                typeof animationsRainbowReducer
              >;
              animState.ids.splice(animIndex, 1);
              delete animState.entities[animId];
            } else if (
              "entities" in state &&
              state.entities &&
              typeof state.entities === "object"
            ) {
              const values = Object.values(state.entities);
              if (values.length && "actions" in values[0]) {
                // Profiles
                for (const v of values) {
                  const profile = v as Serializable.ProfileData;
                  for (const playAnim of profile.actions.playAnimation) {
                    if (playAnim.animationUuid === animId) {
                      console.warn(
                        `Migrating from version 2 to 3: Removing Rainbow Waterfall Overlap from profile ${profile.name} (${profile.uuid})`
                      );
                      playAnim.animationUuid = undefined;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return state;
  },
} as const;

function persist<S, A extends Action = Action>(
  key: string,
  reducer: Reducer<S, A>
) {
  return persistReducer(
    {
      version: 3,
      storage: MyStorage,
      key,
      debug: __DEV__,
      migrate: createMigrate(migrations, { debug: __DEV__ }),
      // blacklist: [...blacklist] as string[],
      // stateReconciler: (
      //   inbound: RootState,
      //   original: RootState,
      //   reduced: RootState,
      //   config: any
      // ) => {
      //   console.log("stateReconciler: ", Object.keys(inbound).join(", "));
      //   return autoMergeLevel1(inbound, original, reduced, config);
      // },
    },
    reducer
  );
}

function persistAnim<S, A extends Action = Action>(
  key: string,
  reducer: Reducer<S, A>
) {
  return persist("library/animations/" + key, reducer);
}

const rootReducer = combineReducers({
  // General app data
  appSettings: persist("appSettings", appSettingsReducer),
  // Dice data
  pairedDice: persist("pairedDice", pairedDiceReducer),
  // Library data
  library: combineReducers({
    profiles: persist("library/profiles", profilesReducer),
    animations: combineReducers({
      cycle: persistAnim("cycles", animationsCycleReducer),
      flashes: persistAnim("flashes", animationsFlashesReducer),
      gradientPattern: persistAnim(
        "gradientPattern",
        animationsGradientPatternReducer
      ),
      gradient: persistAnim("gradient", animationsGradientReducer),
      noise: persistAnim("noise", animationsNoiseReducer),
      normals: persistAnim("normals", animationsNormalsReducer),
      pattern: persistAnim("pattern", animationsPatternReducer),
      rainbow: persistAnim("rainbow", animationsRainbowReducer),
      sequence: persistAnim("sequence", animationsSequenceReducer),
    }),
    patterns: persist("library/patterns", patternsReducer),
    gradients: persist("library/gradients", gradientsReducer),
  }),
  // Transient data
  diceRolls: diceRollsReducer,
  appUpdate: appUpdateReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => {
    const middleware = getDefaultMiddleware({
      immutableCheck: { warnAfter: 200 },
      serializableCheck: {
        warnAfter: 200,
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    });
    return middleware;
  },
});

export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof rootReducer>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export type LibraryState = RootState["library"];

export const profilesSelectors = profilesAdapter.getSelectors<RootState>(
  (state) => state.library.profiles
);

// export const animationsSelectors = animationsAdapter.getSelectors<RootState>(
//   (state) => state.library.animations
// );

export const patternsSelectors = patternsAdapter.getSelectors<RootState>(
  (state) => state.library.patterns
);

export const gradientsSelectors = gradientsAdapter.getSelectors<RootState>(
  (state) => state.library.gradients
);
