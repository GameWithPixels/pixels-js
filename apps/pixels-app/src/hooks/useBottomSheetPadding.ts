import { useSafeAreaInsets } from "react-native-safe-area-context";

export function useBottomSheetPadding(): number {
  const { bottom } = useSafeAreaInsets();
  return Math.max(15, bottom);
}
