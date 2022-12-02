import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";

import dfuFilesReducer from "~/features/store/dfuFilesSlice";

export const store = configureStore({
  reducer: {
    dfuFiles: dfuFilesReducer,
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
