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
import autoMergeLevel2 from "redux-persist/lib/stateReconciler/autoMergeLevel2";

import appSettingsReducer, {
  AppSettingsState,
} from "~/features/store/appSettingsSlice";
import dfuFilesReducer from "~/features/store/dfuFilesSlice";
import validationSettingsReducer, {
  ValidationSettingsState,
} from "~/features/store/validationSettingsSlice";

export const store = configureStore({
  reducer: {
    // Don't persist DFU files so they are always updated
    dfuFiles: dfuFilesReducer,
    appSettings: persistReducer<AppSettingsState>(
      { key: "appSettings", storage: AsyncStorage },
      appSettingsReducer
    ),
    validationSettings: persistReducer<ValidationSettingsState>(
      {
        key: "validationSettings",
        storage: AsyncStorage,
        stateReconciler: autoMergeLevel2,
      },
      validationSettingsReducer
    ),
  },
  middleware: (getDefaultMiddleware) => {
    const middleware = getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    });
    // if (__DEV__) {
    //   const createDebugger = require("redux-flipper").default;
    //   middleware.push(createDebugger());
    // }
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
