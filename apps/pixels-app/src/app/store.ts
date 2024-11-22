import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Action,
  addListener,
  combineReducers,
  configureStore,
  createListenerMiddleware,
  Reducer,
  ThunkAction,
  TypedAddListener,
  TypedStartListening,
} from "@reduxjs/toolkit";
import {
  createMigrate,
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from "redux-persist";

import { PairedDie } from "./PairedDie";
import migrations from "./migrations";

import appSettingsReducer from "~/features/store/appSettingsSlice";
import appTransientReducer from "~/features/store/appTransientSlice";
import diceRollerReducer from "~/features/store/diceRollerSlice";
import diceStatsReducer from "~/features/store/diceStatsSlice";
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
import audioClipsReducer from "~/features/store/libraryAssets/audioClipsSlice";
import pairedDiceReducer from "~/features/store/pairedDiceSlice";
import pairedMPCsReducer from "~/features/store/pairedMPCsSlice";

const MyStorage = !__DEV__
  ? AsyncStorage
  : {
      setItem: (key: string, value: string) => {
        console.log(`AsyncStorage Write => ${key}`);
        return AsyncStorage.setItem(key, value);
      },
      getItem: (key: string) => {
        console.log(`AsyncStorage Read => ${key}`);
        return AsyncStorage.getItem(key);
      },
      removeItem: (key: string) => {
        console.log(`AsyncStorage Delete => ${key}`);
        return AsyncStorage.removeItem(key);
      },
    };

function persist<S, A extends Action = Action>(
  key: string,
  reducer: Reducer<S, A>
) {
  return persistReducer(
    {
      version: 5,
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
  pairedMPCs: persist("pairedMPCs", pairedMPCsReducer),
  diceStats: persist("diceStats", diceStatsReducer),
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
  // Library assets
  libraryAssets: combineReducers({
    audioClips: persistAnim("libraryAssets/audioClips", audioClipsReducer),
  }),
  // Dice roller
  diceRoller: persist("diceRoller", diceRollerReducer),
  // Transient data
  appTransient: appTransientReducer,
});

// Create the middleware instance and methods
const listenerMiddleware = createListenerMiddleware();

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
    const withListener = middleware.prepend(listenerMiddleware.middleware);
    // @ts-ignore
    return withListener as typeof middleware;
  },
});

export const persistor = persistStore(store);

export type AppStore = typeof store;
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof rootReducer>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export type LibraryState = RootState["library"];

export const startAppListening =
  listenerMiddleware.startListening as TypedStartListening<
    RootState,
    AppDispatch
  >;
export const addAppListener = addListener as TypedAddListener<
  RootState,
  AppDispatch
>;

export const profilesSelectors = Object.freeze(
  profilesAdapter.getSelectors<RootState>((state) => state.library.profiles)
);

// export const animationsSelectors = Object.freeze(
//  animationsAdapter.getSelectors<RootState>((state) => state.library.animations)
// );

export const patternsSelectors = Object.freeze(
  patternsAdapter.getSelectors<RootState>((state) => state.library.patterns)
);

export const gradientsSelectors = Object.freeze(
  gradientsAdapter.getSelectors<RootState>((state) => state.library.gradients)
);

export const pairedDiceSelectors = {
  selectByPixelId(state: RootState, pixelId: number): PairedDie | undefined {
    return state.pairedDice.paired.find((d) => d.pixelId === pixelId);
  },
  selectByProfileUuid(
    state: RootState,
    profileUuid: string
  ): PairedDie | undefined {
    return state.pairedDice.paired.find((d) => d.profileUuid === profileUuid);
  },
} as const;
