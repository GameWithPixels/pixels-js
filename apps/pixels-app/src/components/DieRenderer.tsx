import {
  ActionPlayAnimation,
  createDataSetForAnimation,
  createDataSetForProfile,
} from "@systemic-games/pixels-edit-animation";
import {
  PixelInfo,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";

import {
  applyActionOverrides,
  applyProfileOverrides,
  getCompatibleDiceTypes,
} from "~/features/profiles";
import {
  DieRendererProps,
  DieRendererWithFocus,
} from "~/features/render3d/DieRenderer";
import { notEmpty } from "~/features/utils";
import { useActiveProfile } from "~/hooks";

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
        const dataSet = createDataSetForProfile(
          applyProfileOverrides(rolledProfile)
        ).toDataSet();
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

export const PixelDieRenderer = React.memo(function PixelDieRenderer({
  pixel,
  speed,
}: { pixel: Pick<PixelInfo, "pixelId" | "dieType" | "colorway"> } & Pick<
  DieRendererProps,
  "speed"
>) {
  const activeProfile = useActiveProfile(pixel);
  return getCompatibleDiceTypes(activeProfile.dieType).includes(
    pixel.dieType
  ) ? (
    <ProfileDieRenderer
      profile={activeProfile}
      colorway={pixel.colorway}
      speed={speed}
    />
  ) : (
    <DieRendererWithFocus dieType={pixel.dieType} colorway={pixel.colorway} />
  );
});
