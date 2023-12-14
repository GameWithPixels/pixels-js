import { useSafeAreaInsets } from "react-native-safe-area-context";

export function useBottomSheetPadding(minPadding = 15): number {
  const { bottom } = useSafeAreaInsets();
  return Math.max(minPadding, bottom);
}
