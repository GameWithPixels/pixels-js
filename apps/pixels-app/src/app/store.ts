import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Action,
  combineReducers,
  configureStore,
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
// import autoMergeLevel1 from "redux-persist/lib/stateReconciler/autoMergeLevel1";

import dfuFilesReducer from "~/features/store/appDfuFilesSlice";
import appSettingsReducer from "~/features/store/appSettingsSlice";
import diceRollsReducer from "~/features/store/diceRollsSlice";
import { gradientsAdapter } from "~/features/store/library/gradientsSlice";
import { patternsAdapter } from "~/features/store/library/patternsSlice";
import { profilesAdapter } from "~/features/store/library/profilesSlice";
import libraryReducer from "~/features/store/library/reducer";
import { templatesAdapter } from "~/features/store/library/templatesSlice";
import pairedDiceReducer from "~/features/store/pairedDiceSlice";

const rootReducer = combineReducers({
  // General app data
  appSettings: appSettingsReducer,
  // Dice data
  pairedDice: pairedDiceReducer,
  // Library data
  library: libraryReducer,
  // Transient data
  diceRolls: diceRollsReducer,
  dfuFiles: dfuFilesReducer,
});

export const store = configureStore({
  reducer: persistReducer<RootState>(
    {
      key: "root",
      storage: AsyncStorage,
      blacklist: ["diceRolls", "dfuFiles"], // TODO type this with RootState keys
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
    rootReducer
  ),
  middleware: (getDefaultMiddleware) => {
    const middleware = getDefaultMiddleware({
      serializableCheck: {
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

export const templatesSelectors = templatesAdapter.getSelectors<RootState>(
  (state) => state.library.templates
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
