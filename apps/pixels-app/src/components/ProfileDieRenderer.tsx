import { ActionPlayAnimation } from "@systemic-games/pixels-edit-animation";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";

import { createProfileDataSetWithOverrides } from "~/features/profiles";
import {
  DieRendererProps,
  DieRendererWithFocus,
} from "~/features/render3d/DieRenderer";
import { notEmpty } from "~/features/utils";

export const ProfileDieRenderer = observer(function ProfileDieRenderer({
  profile,
  colorway = "onyxBlack",
  pedestal,
  speed,
}: {
  profile: Readonly<Profiles.Profile>;
} & Pick<DieRendererProps, "pedestal" | "speed"> &
  Partial<Pick<DieRendererProps, "colorway">>) {
  const animationsData = React.useMemo(
    () =>
      computed(() => {
        const rolledProfile = new Profiles.Profile({
          rules: profile.rules.filter(
            (r) =>
              r.condition.type === "rolled" &&
              r.actions.some((a) => a.type === "playAnimation")
          ),
        });
        const dataSet = createProfileDataSetWithOverrides(rolledProfile, 1);
        return {
          // Only play animations triggered by action
          animations: dataSet.actions
            .map((a) =>
              a instanceof ActionPlayAnimation
                ? dataSet.animations[a.animIndex]
                : undefined
            )
            .filter(notEmpty),
          bits: dataSet.animationBits,
        };
      }),
    [profile]
  ).get();
  return (
    <DieRendererWithFocus
      dieType={profile.dieType}
      colorway={colorway}
      animationsData={animationsData}
      pedestal={pedestal}
      speed={speed}
    />
  );
});
