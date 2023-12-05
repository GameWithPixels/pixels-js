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

import appSettingsReducer, {
  AppSettingsState,
} from "~/features/store/appSettingsSlice";
import pairedDiceReducer, {
  PairedDiceState,
} from "~/features/store/pairedDiceSlice";

const conf = { key: "user", storage: AsyncStorage };

export const store = configureStore({
  reducer: {
    appSettings: persistReducer<AppSettingsState>(conf, appSettingsReducer),
    pairedDice: persistReducer<PairedDiceState>(conf, pairedDiceReducer),
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
