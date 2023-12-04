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

import profilesSetReducer, {
  ProfileSetState,
} from "~/features/appDataSet/profilesSetSlice";
import pairedDiceReducer, { PairedDiceState } from "~/features/pairedDiceSlice";
import themeModeReducer, { ThemeModeState } from "~/features/themeModeSlice";

const conf = { key: "user", storage: AsyncStorage };

export const store = configureStore({
  reducer: {
    themeMode: persistReducer<ThemeModeState>(conf, themeModeReducer),
    pairedDice: persistReducer<PairedDiceState>(conf, pairedDiceReducer),
    profilesSet: persistReducer<ProfileSetState>(conf, profilesSetReducer),
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
