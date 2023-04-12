import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";

import dfuFilesReducer from "~/features/store/dfuFilesSlice";
import displaySettingsReducer from "~/features/store/displaySettingsSlice";

export const store = configureStore({
  reducer: {
    dfuFiles: dfuFilesReducer,
    displaySettings: displaySettingsReducer,
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
