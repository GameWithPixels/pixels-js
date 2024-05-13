import React from "react";
import {
  TypedUseSelectorHook,
  useDispatch,
  useSelector,
  useStore,
} from "react-redux";

import type { RootState, AppDispatch } from "./store";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Returns a stable function that reads the dice brightness factor from the store
export function useAppDiceBrightnessGetter() {
  const store = useStore<RootState>();
  return React.useCallback(
    () => store.getState().appSettings.diceBrightnessFactor,
    [store]
  );
}
