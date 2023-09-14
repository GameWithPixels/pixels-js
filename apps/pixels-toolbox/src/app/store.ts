import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";

import dfuBundlesReducer from "~/features/store/dfuBundlesSlice";
import displaySettingsReducer from "~/features/store/displaySettingsSlice";
import validationSettingsReducer from "~/features/store/validationSettingsSlice";

export const store = configureStore({
  reducer: {
    dfuBundles: dfuBundlesReducer,
    displaySettings: displaySettingsReducer,
    validationSettings: validationSettingsReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
