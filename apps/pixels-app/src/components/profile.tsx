import { range } from "@systemic-games/pixels-core-utils";
import { getBorderRadius } from "@systemic-games/react-native-base-components";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { LinearGradient } from "expo-linear-gradient";
import { observer } from "mobx-react-lite";
import React from "react";
import { View, ViewProps } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Animated, { FadeIn } from "react-native-reanimated";

import { ProfileDieRenderer } from "./ProfileDieRenderer";
import { TouchableCardProps, TouchableCard } from "./TouchableCard";
import { ActionTypeIcon } from "./actions";
import { darken, getBorderColor } from "./colors";

import {
  groupAndSortProfiles,
  ProfilesGrouping,
  SortMode,
} from "~/features/profiles";
import { useDiceNamesForProfile } from "~/hooks";

const ProfileNameAndDescription = observer(function ProfileNameAndDescription({
  profile,
  row,
  numberOfLines,
  textStyle,
}: {
  profile: Readonly<Profiles.Profile>;
  row?: boolean;
  numberOfLines: number;
  textStyle: { color: string } | undefined;
}) {
  return (
    <>
      <Text
        numberOfLines={1}
        style={textStyle}
        variant={row ? "titleLarge" : "titleMedium"}
      >
        {profile.name}
      </Text>
      {!!profile.description.length && (
        <Text numberOfLines={numberOfLines} style={textStyle}>
          {profile.description}
        </Text>
      )}
    </>
  );
});

const ProfileDiceNames = observer(function ProfileDiceNames({
  profile,
}: {
  profile: Readonly<Profiles.Profile>;
}) {
  const diceNames = useDiceNamesForProfile(profile.uuid);
  return (
    <Text>
      {diceNames.length ? diceNames.join(", ") : "Not copied on any die"}
    </Text>
  );
});

const ProfileActionsIcons = observer(function ProfileActionsIcons({
  children,
  profile,
  gap,
  iconColor,
}: React.PropsWithChildren<{
  profile: Readonly<Profiles.Profile>;
  gap: number;
  iconColor: string;
}>) {
  const actions = profile.rules.flatMap((r) => r.actions);
  const hasAnim = actions.some((a) => a.type === "playAnimation");
  const hasSound = actions.some((a) => a.type === "playAudioClip");
  const hasSpeak = actions.some((a) => a.type === "speakText");
  const hasWeb = actions.some((a) => a.type === "makeWebRequest");
  return (
    <View
      style={{
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap,
        height: 24,
      }}
    >
      {hasAnim && (
        <ActionTypeIcon type="playAnimation" size={16} color={iconColor} />
      )}
      {hasSpeak && (
        <ActionTypeIcon type="speakText" size={16} color={iconColor} />
      )}
      {hasSound && (
        <ActionTypeIcon type="playAudioClip" size={16} color={iconColor} />
      )}
      {hasWeb && (
        <ActionTypeIcon type="makeWebRequest" size={16} color={iconColor} />
      )}
      {children}
    </View>
  );
});

export interface ProfileCardProps extends Omit<TouchableCardProps, "children"> {
  profile: Readonly<Profiles.Profile>;
  fadeInDuration?: number;
  fadeInDelay?: number;
}

export function ProfileCard({
  profile,
  row,
  disabled,
  selected,
  squaredTopBorder,
  squaredBottomBorder,
  noBorder,
  noTopBorder,
  noBottomBorder,
  fadeInDuration,
  fadeInDelay,
  style,
  contentStyle,
  ...props
}: ProfileCardProps) {
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  const dieViewCornersStyle = {
    borderTopLeftRadius: squaredTopBorder ? 0 : borderRadius,
    borderTopRightRadius: row ?? squaredTopBorder ? 0 : borderRadius,
    borderBottomLeftRadius: !row || squaredBottomBorder ? 0 : borderRadius,
  };
  const color = disabled ? colors.onSurfaceDisabled : colors.onPrimary;

  const die3dWidth = row ? 120 : "100%";
  const height = 100;
  return (
    <Animated.View
      entering={FadeIn.duration(fadeInDuration ?? 300).delay(fadeInDelay ?? 0)}
    >
      <TouchableCard
        row={row}
        disabled={disabled}
        style={style}
        contentStyle={[{ padding: 0 }, contentStyle]}
        squaredTopBorder={squaredTopBorder}
        squaredBottomBorder={squaredBottomBorder}
        noBorder
        {...props}
      >
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: die3dWidth,
            // Borders (having issues on iOS with those borders applied on the LinearGradient)
            borderWidth: noBorder ? 0 : 1,
            borderRightWidth: noBorder ?? row ? 0 : 1,
            borderTopWidth: noBorder ?? noTopBorder ? 0 : undefined,
            borderBottomWidth:
              noBorder ?? noBottomBorder ?? !row ? 0 : undefined,
            borderColor: getBorderColor(colors, selected),
            // Corners
            ...dieViewCornersStyle,
          }}
        >
          <View
            style={{
              width: "100%",
              height,
              paddingHorizontal: 2,
              paddingVertical: 2,
            }}
          >
            <ProfileDieRenderer profile={profile} pedestal />
          </View>
        </View>
        <View
          style={{
            alignSelf: "stretch",
            flex: 1,
            flexDirection: "column",
            justifyContent: "space-around",
            paddingHorizontal: row ? 10 : 5,
            paddingTop: row ? 5 : 0,
            // Borders
            borderWidth: noBorder ? 0 : 1,
            borderLeftWidth: noBorder ?? row ? 0 : 1,
            borderTopWidth: noBorder ?? noTopBorder ?? !row ? 0 : 1,
            borderColor: getBorderColor(colors, selected),
            // Corners
            borderTopRightRadius: !row || squaredTopBorder ? 0 : borderRadius,
            borderBottomLeftRadius:
              row ?? squaredBottomBorder ? 0 : borderRadius,
            borderBottomRightRadius: squaredBottomBorder ? 0 : borderRadius,
          }}
        >
          <ProfileNameAndDescription
            profile={profile}
            row={row}
            numberOfLines={2}
            textStyle={{ color }}
          />
          <ProfileActionsIcons
            profile={profile}
            gap={row ? 10 : 5}
            iconColor={colors.onSurface}
          >
            <ProfileDiceNames profile={profile} />
          </ProfileActionsIcons>
        </View>
      </TouchableCard>
      {/* Render gradient outside of touchable so the ripple effects works */}
      <Animated.View
        style={{
          position: "absolute",
          zIndex: -1,
          width: die3dWidth,
          ...dieViewCornersStyle,
        }}
      >
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          colors={[darken(colors.primary, 0.4), darken(colors.secondary, 0.4)]}
          style={{
            width: "100%",
            height: "100%",
            ...dieViewCornersStyle,
          }}
        />
      </Animated.View>
    </Animated.View>
  );
}

export interface ProfilesListProps extends ViewProps {
  profiles: Readonly<Profiles.Profile>[];
  selected?: Readonly<Profiles.Profile>;
  groupBy?: ProfilesGrouping;
  sortMode?: SortMode;
  onSelectProfile?: (profile: Readonly<Profiles.Profile>) => void;
  onProgramDice?: (profile: Readonly<Profiles.Profile>) => void;
}

export function ProfilesList({
  profiles,
  selected,
  groupBy,
  sortMode,
  onSelectProfile,
  style,
  ...props
}: ProfilesListProps) {
  const profilesGroups = React.useMemo(
    () => groupAndSortProfiles(profiles, groupBy, sortMode),
    [profiles, groupBy, sortMode]
  );

  return (
    <View style={[{ gap: 10 }, style]} {...props}>
      {profilesGroups.map(({ title, values: profiles }, i) => (
        <View key={title + i} style={{ gap: 10 }}>
          {profiles.map((p) => (
            <ProfileCard
              key={p.uuid}
              row
              profile={p}
              selected={p === selected}
              fadeInDelay={i * 50}
              onPress={() => onSelectProfile?.(p)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function ProfilesColumn({
  profiles,
  selected,
  onSelectProfile,
  style,
  ...props
}: ProfilesListProps) {
  return (
    <View style={[{ flex: 1, gap: 10 }, style]} {...props}>
      {profiles.map((p, i) => (
        <ProfileCard
          key={p.uuid}
          profile={p}
          selected={p === selected}
          fadeInDuration={500}
          fadeInDelay={i * 100}
          contentStyle={{ height: 200 }}
          onPress={() => onSelectProfile?.(p)}
        />
      ))}
    </View>
  );
}

export function ProfilesGrid({
  profiles,
  selected,
  numColumns = 3,
  onSelectProfile,
  style,
  ...props
}: {
  numColumns?: number;
} & ProfilesListProps) {
  return (
    <View style={[{ flexDirection: "row", gap: 10 }, style]} {...props}>
      {range(numColumns).map((col) => (
        <ProfilesColumn
          key={col}
          profiles={profiles.filter((_, i) => i % numColumns === col)}
          selected={selected}
          onSelectProfile={onSelectProfile}
        />
      ))}
    </View>
  );
}
