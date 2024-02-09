import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Action,
  combineReducers,
  configureStore,
  Reducer,
  ThunkAction,
} from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from "redux-persist";

import dfuFilesReducer from "~/features/store/appDfuFilesSlice";
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

function persist<S, A extends Action = Action>(
  key: string,
  reducer: Reducer<S, A>
) {
  return persistReducer(
    {
      version: 1,
      storage: MyStorage,
      key,
      // debug: true,
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
  dfuFiles: dfuFilesReducer,
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
