import AsyncStorage from "@react-native-async-storage/async-storage";
import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";
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
import appSettingsReducer, {
  AppSettingsState,
} from "~/features/store/appSettingsSlice";
import pairedDiceReducer, {
  PairedDiceState,
} from "~/features/store/pairedDiceSlice";
import profilesLibraryReducer, {
  LibraryState,
} from "~/features/store/profilesLibrarySlice";

function conf(key: string) {
  return {
    key,
    storage: AsyncStorage,
  };
}

export const store = configureStore({
  reducer: {
    appSettings: persistReducer<AppSettingsState>(
      conf("settings"),
      appSettingsReducer
    ),
    pairedDice: persistReducer<PairedDiceState>(
      conf("pairedDice"),
      pairedDiceReducer
    ),
    profilesLibrary: persistReducer<LibraryState>(
      conf("profilesLibrary"),
      profilesLibraryReducer
    ),
    dfuFiles: dfuFilesReducer, // We don't persist this one
  },
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
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
