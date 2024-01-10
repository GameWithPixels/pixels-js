import { BottomSheetModal, BottomSheetModalProps } from "@gorhom/bottom-sheet";
import { useCallback, useRef } from "react";
import { BackHandler, NativeEventSubscription } from "react-native";

/**
 * hook that dismisses the bottom sheet on the hardware back button press if it is visible
 * @param bottomSheetRef ref to the bottom sheet which is going to be closed/dismissed on the back press
 * Source: https://github.com/gorhom/react-native-bottom-sheet/issues/556#issuecomment-1023123434
 */
export function useBottomSheetBackHandler(
  bottomSheetRef: React.RefObject<BottomSheetModal | null>
): (index: number) => void {
  const backHandlerSubscriptionRef = useRef<NativeEventSubscription | null>(
    null
  );
  return useCallback<NonNullable<BottomSheetModalProps["onChange"]>>(
    (index) => {
      const isBottomSheetVisible = index >= 0;
      if (isBottomSheetVisible && !backHandlerSubscriptionRef.current) {
        // setup the back handler if the bottom sheet is right in front of the user
        backHandlerSubscriptionRef.current = BackHandler.addEventListener(
          "hardwareBackPress",
          () => {
            bottomSheetRef.current?.dismiss();
            return true;
          }
        );
      } else if (!isBottomSheetVisible) {
        backHandlerSubscriptionRef.current?.remove();
        backHandlerSubscriptionRef.current = null;
      }
    },
    [bottomSheetRef, backHandlerSubscriptionRef]
  );
}
