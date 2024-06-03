import { createDataSetForAnimation } from "@systemic-games/pixels-edit-animation";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";

import {
  DieRendererProps,
  DieRendererWithFocus,
} from "~/features/render3d/DieRenderer";

export const AnimationDieRenderer = observer(function AnimationDieRenderer({
  animation,
  dieType,
  colorway = "onyxBlack",
  pedestal,
  speed,
}: {
  animation: Readonly<Profiles.Animation>;
} & Pick<DieRendererProps, "pedestal" | "speed" | "dieType"> &
  Partial<Pick<DieRendererProps, "colorway">>) {
  const animationsData = React.useMemo(
    () =>
      computed(() => {
        const dataSet = createDataSetForAnimation(animation).toDataSet();
        return {
          animations: dataSet.animations,
          bits: dataSet.animationBits,
        };
      }),
    [animation]
  ).get();
  return (
    <DieRendererWithFocus
      dieType={dieType}
      colorway={colorway}
      animationsData={animationsData}
      pedestal={pedestal}
      speed={speed}
    />
  );
});
