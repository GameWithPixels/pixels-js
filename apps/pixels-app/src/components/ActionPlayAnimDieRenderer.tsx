import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";

import { AnimationDieRenderer } from "./AnimationDieRenderer";
import { DieRendererWithFocus } from "./DieRendererWithFocus";

import { applyActionOverrides } from "~/features/profiles";
import { DieRendererProps } from "~/features/render3d/DieRenderer";

export const ActionPlayAnimDieRenderer = observer(
  function ActionPlayAnimDieRenderer({
    action,
    colorway = "onyxBlack",
    ...props
  }: {
    action: Readonly<Profiles.ActionPlayAnimation>;
  } & Pick<DieRendererProps, "pedestal" | "speed" | "dieType"> &
    Partial<Pick<DieRendererProps, "colorway">>) {
    const animation = React.useMemo(
      () => computed(() => applyActionOverrides(action)),
      [action]
    ).get();
    return animation ? (
      <AnimationDieRenderer
        animation={animation}
        colorway={colorway}
        {...props}
      />
    ) : (
      <DieRendererWithFocus colorway={colorway} {...props} />
    );
  }
);
