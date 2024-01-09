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

import { Library } from "~/features/store";
import dfuFilesReducer from "~/features/store/appDfuFilesSlice";
import appSettingsReducer, {
  AppSettingsState,
} from "~/features/store/appSettingsSlice";
import diceRollsReducer from "~/features/store/diceRollsSlice";
import animationsReducer, {
  animationsAdapter,
  AnimationsState,
} from "~/features/store/library/animationsSlice";
import gradientsReducer, {
  gradientsAdapter,
  GradientsState,
} from "~/features/store/library/gradientsSlice";
import patternsReducer, {
  patternsAdapter,
  PatternsState,
} from "~/features/store/library/patternsSlice";
import profilesReducer, {
  profilesAdapter,
  ProfilesState,
} from "~/features/store/library/profilesSlice";
import templatesReducer, {
  templatesAdapter,
  TemplatesState,
} from "~/features/store/library/templatesSlice";
import pairedDiceReducer, {
  PairedDiceState,
} from "~/features/store/pairedDiceSlice";

function conf(key: string) {
  return {
    key,
    storage: AsyncStorage,
  };
}

export const store = configureStore({
  reducer: {
    // General app data
    appSettings: persistReducer<AppSettingsState>(
      conf("settings"),
      appSettingsReducer
    ),
    // Dice data
    pairedDice: persistReducer<PairedDiceState>(
      conf("pairedDice"),
      pairedDiceReducer
    ),
    // Library data
    profiles: persistReducer<ProfilesState>(conf("profiles"), profilesReducer),
    templates: persistReducer<TemplatesState>(
      conf("templates"),
      templatesReducer
    ),
    animations: persistReducer<AnimationsState>(
      conf("animations"),
      animationsReducer
    ),
    patterns: persistReducer<PatternsState>(conf("patterns"), patternsReducer),
    gradients: persistReducer<GradientsState>(
      conf("gradients"),
      gradientsReducer
    ),
    // Transient data
    diceRolls: diceRollsReducer,
    dfuFiles: dfuFilesReducer,
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

export type LibraryState = Pick<
  RootState,
  "profiles" | "templates" | "animations" | "patterns" | "gradients"
>;

export const profilesSelectors = profilesAdapter.getSelectors<RootState>(
  (state) => state.profiles
);

export const templatesSelectors = templatesAdapter.getSelectors<RootState>(
  (state) => state.templates
);

export const animationsSelectors = animationsAdapter.getSelectors<RootState>(
  (state) => state.animations
);

export const patternsSelectors = patternsAdapter.getSelectors<RootState>(
  (state) => state.patterns
);

export const gradientsSelectors = gradientsAdapter.getSelectors<RootState>(
  (state) => state.gradients
);
