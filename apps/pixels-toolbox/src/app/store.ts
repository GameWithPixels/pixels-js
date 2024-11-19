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
  StateReconciler,
} from "redux-persist";
import autoMergeLevel2 from "redux-persist/lib/stateReconciler/autoMergeLevel2";

import appSettingsReducer, {
  AppSettingsState,
} from "~/features/store/appSettingsSlice";
import dfuFilesReducer from "~/features/store/dfuFilesSlice";
import validationSettingsReducer, {
  ValidationSettingsState,
} from "~/features/store/validationSettingsSlice";

function conf<S>(key: string, stateReconciler?: false | StateReconciler<S>) {
  return {
    key,
    storage: AsyncStorage,
    stateReconciler,
  };
}

export const store = configureStore({
  reducer: {
    // Don't persist DFU bundles so they are always updated
    // and imported ones are removed on reload
    dfuFiles: dfuFilesReducer,
    appSettings: persistReducer<AppSettingsState>(
      conf("appSettings"),
      appSettingsReducer
    ),
    validationSettings: persistReducer<ValidationSettingsState>(
      conf<ValidationSettingsState>("validationSettings", autoMergeLevel2),
      validationSettingsReducer
    ),
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
