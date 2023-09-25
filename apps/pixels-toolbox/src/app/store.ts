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

import dfuBundlesReducer from "~/features/store/dfuBundlesSlice";
import displaySettingsReducer, {
  DisplaySettingsState,
} from "~/features/store/displaySettingsSlice";
import validationSettingsReducer, {
  ValidationSettingsState,
} from "~/features/store/validationSettingsSlice";

const conf = { key: "user", storage: AsyncStorage };

export const store = configureStore({
  reducer: {
    // Don't persist DFU bundles so they are always updated
    // and imported ones are removed on reload
    dfuBundles: dfuBundlesReducer,
    displaySettings: persistReducer<DisplaySettingsState>(
      conf,
      displaySettingsReducer
    ),
    validationSettings: persistReducer<ValidationSettingsState>(
      conf,
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
