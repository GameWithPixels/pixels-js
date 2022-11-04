import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";

import themeModeReducer from "~/features/themeModeSlice";

export const store = configureStore({
  reducer: {
    themeMode: themeModeReducer,
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
