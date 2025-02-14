import { useSafeAreaInsets } from "react-native-safe-area-context";

// When to use? See also paddingBottom: 20 in several screens
export function useBottomSheetPadding(minPadding = 15): number {
  const { bottom } = useSafeAreaInsets();
  return Math.max(minPadding, bottom);
}
