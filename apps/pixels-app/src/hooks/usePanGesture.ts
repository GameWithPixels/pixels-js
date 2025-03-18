import { Gesture } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";

export function usePanGesture({
  direction,
  onChange, // Worklet
  onEnd, // Worklet
}: {
  direction: "horizontal" | "vertical";
  onChange: (translation: number) => void;
  onEnd: () => void;
}) {
  const initialTouchLocation = useSharedValue<{ x: number; y: number } | null>(
    null
  );
  const pressed = useSharedValue(false);
  // https://github.com/software-mansion/react-native-gesture-handler/issues/1933#issuecomment-1566953466
  return Gesture.Pan()
    .manualActivation(true)
    .onBegin((ev) => {
      initialTouchLocation.value = { x: ev.x, y: ev.y };
    })
    .onTouchesMove((ev, state) => {
      // Sanity checks
      if (!initialTouchLocation.value || !ev.changedTouches.length) {
        state.fail();
      } else {
        const touch = ev.changedTouches[0];
        const xDiff = Math.abs(touch.x - initialTouchLocation.value.x);
        const yDiff = Math.abs(touch.y - initialTouchLocation.value.y);
        // Check if the gesture is horizontal or vertical, and if it's already activated
        // as we don't want to interrupt an ongoing swipe
        if (
          pressed.value ||
          (direction === "horizontal" && xDiff > yDiff) ||
          (direction === "vertical" && yDiff > xDiff)
        ) {
          // Vertical panning
          state.activate();
        } else {
          state.fail();
        }
      }
    })
    .onStart(() => (pressed.value = true))
    .onChange((ev) =>
      onChange(direction === "horizontal" ? ev.translationX : ev.translationY)
    )
    .onEnd(() => {
      pressed.value = false;
      onEnd();
    });
}
