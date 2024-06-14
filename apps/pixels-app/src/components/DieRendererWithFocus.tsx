import { useFocusEffect } from "@react-navigation/native";
import React from "react";
import { useReducedMotion } from "react-native-reanimated";

import { useAppSelector } from "~/app/hooks";
import { DieRendererProps, DieRenderer } from "~/features/render3d/DieRenderer";

export function DieRendererWithFocus({
  animationsData,
  speed,
  ...props
}: Omit<DieRendererProps, "paused">) {
  const [paused, setPaused] = React.useState(false);
  useFocusEffect(
    React.useCallback(() => {
      setPaused(false);
      return () => setPaused(true);
    }, [])
  );
  // Remove animations if disabled
  const disablePlayingAnimations = useAppSelector(
    (state) => state.appSettings.disablePlayingAnimations
  );
  if (disablePlayingAnimations) {
    animationsData = undefined;
  }
  // Compute speed
  const reducedMotion = useReducedMotion();
  speed = speed ?? (props.pedestal ? 0.5 : 1);
  speed = reducedMotion ? speed / 3 : speed;
  return (
    <DieRenderer
      animationsData={animationsData}
      speed={speed}
      paused={paused}
      {...props}
    />
  );
}
