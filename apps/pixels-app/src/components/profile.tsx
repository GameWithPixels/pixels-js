import { Fontisto, MaterialCommunityIcons } from "@expo/vector-icons";
import { range } from "@systemic-games/pixels-core-utils";
import { createDataSetForProfile } from "@systemic-games/pixels-edit-animation";
import { getBorderRadius } from "@systemic-games/react-native-base-components";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { Profile } from "@systemic-games/react-native-pixels-connect/src/Profiles";
import { LinearGradient } from "expo-linear-gradient";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";
import { useWindowDimensions, View, ViewProps } from "react-native";
import { ActivityIndicator, Text, useTheme } from "react-native-paper";
import Animated, {
  FadeIn,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { TouchableCardProps, TouchableCard } from "./TouchableCard";
import { ActionTypeIcon } from "./actions";
import { Chip, GradientChip } from "./buttons";
import { darken, getBorderColor, getTextColorStyle } from "./colors";

import { useAppSelector } from "~/app/hooks";
import {
  groupAndSortProfiles,
  ProfilesGrouping,
  SortMode,
} from "~/features/profiles";
import {
  DieRendererProps,
  DieRendererWithFocus,
} from "~/features/render3d/DieRenderer";

const ProfileNameAndDescription = observer(function ProfileNameAndDescription({
  profile,
  row,
  description,
  numberOfLines,
  textStyle,
}: {
  profile: Readonly<Profiles.Profile>;
  row?: boolean;
  description?: string;
  numberOfLines: number;
  textStyle: { color: string } | undefined;
}) {
  description = description ?? profile.description;
  return (
    <>
      <Text
        numberOfLines={1}
        style={textStyle}
        variant={row ? "titleLarge" : "titleMedium"}
      >
        {profile.name}
      </Text>
      {!!description.length && (
        <Text numberOfLines={numberOfLines} style={textStyle}>
          {description}
        </Text>
      )}
    </>
  );
});

const ProfileDiceNames = observer(function ProfileDiceNames({
  profile,
  iconColor,
}: {
  profile: Readonly<Profiles.Profile>;
  iconColor: string;
}) {
  const diceNames = useAppSelector((state) => state.pairedDice.dice)
    .filter((d) => d.isPaired && d.profileUuid === profile.uuid)
    .map((d) => d.name);
  return (
    <View
      style={{
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <MaterialCommunityIcons
        name="dice-multiple-outline"
        size={24}
        color={iconColor}
      />
      <Text>
        {diceNames.length ? diceNames.join(", ") : "Not activated on any die"}
      </Text>
    </View>
  );
});

const ProfileLastChanged = observer(function ProfileDiceNames({
  profile,
  iconColor,
}: {
  profile: Readonly<Profiles.Profile>;
  iconColor: string;
}) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 15,
      }}
    >
      <Fontisto name="date" size={16} color={iconColor} />
      <Text>{profile.lastChanged.toLocaleString()}</Text>
    </View>
  );
});

function ProfileActions({
  profile,
  transferring,
  onAction,
}: {
  profile: Readonly<Profiles.Profile>;
  transferring?: boolean;
  onAction?: (
    action: "edit" | "activate",
    profile: Readonly<Profiles.Profile>
  ) => void;
}) {
  const { width } = useWindowDimensions();
  return (
    <View
      style={{
        flexDirection: "row",
        marginRight: 20,
        justifyContent: "space-around",
      }}
    >
      {/* TODO make button smaller? */}
      {width > 350 && (
        <GradientChip
          // icon={({ size, color }) => (
          //   <MaterialCommunityIcons name="upload" size={size} color={color} />
          // )}
          disabled={transferring}
          sentry-label="activate-on-die"
          onPress={() => onAction?.("activate", profile)}
        >
          Activate
        </GradientChip>
      )}
      <Chip
        icon={({ size, color }) => (
          <MaterialCommunityIcons
            name="movie-open-edit-outline"
            size={size}
            color={color}
          />
        )}
        onPress={() => onAction?.("edit", profile)}
      >
        Edit
      </Chip>
    </View>
  );
}

const ProfileActionsIcons = observer(function ProfileActionsIcons({
  profile,
  gap,
  iconColor,
}: {
  profile: Readonly<Profiles.Profile>;
  gap: number;
  iconColor: string;
}) {
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
      {hasSound && (
        <ActionTypeIcon type="playAudioClip" size={16} color={iconColor} />
      )}
      {hasSpeak && (
        <ActionTypeIcon type="speakText" size={16} color={iconColor} />
      )}
      {hasWeb && (
        <ActionTypeIcon type="makeWebRequest" size={16} color={iconColor} />
      )}
    </View>
  );
});

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
        const dataSet = createDataSetForProfile(rolledProfile).toDataSet();
        return {
          animations: dataSet.animations,
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

export interface ProfileCardProps extends Omit<TouchableCardProps, "children"> {
  profile: Readonly<Profiles.Profile>;
  transferring?: boolean;
  description?: string;
  expanded?: SharedValue<boolean>;
  fadeInDuration?: number;
  fadeInDelay?: number;
  onAction?: (
    action: "edit" | "activate",
    profile: Readonly<Profiles.Profile>
  ) => void;
}

export function ProfileCard({
  profile,
  row,
  disabled,
  selected,
  expanded,
  transferring,
  description,
  squaredTopBorder,
  squaredBottomBorder,
  noBorder,
  noTopBorder,
  noBottomBorder,
  fadeInDuration,
  fadeInDelay,
  onAction,
  style,
  contentStyle,
  ...props
}: ProfileCardProps) {
  const transferredProfileUuid = useAppSelector(
    (state) => state.diceRolls.transfer?.profileUuid
  );
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  const dieViewCornersStyle = {
    borderTopLeftRadius: squaredTopBorder ? 0 : borderRadius,
    borderTopRightRadius: row ?? squaredTopBorder ? 0 : borderRadius,
    borderBottomLeftRadius: !row || squaredBottomBorder ? 0 : borderRadius,
  };
  const textStyle = getTextColorStyle(colors, disabled);

  const animTopLeftStyle = useAnimatedStyle(
    () => ({
      height: expanded ? withTiming(expanded.value ? 200 : 100) : 100,
    }),
    [expanded]
  );
  const animBottomStyle = useAnimatedStyle(
    () => ({
      height: expanded ? withTiming(expanded.value ? 100 : 0) : 0,
      width: "100%",
      overflow: "hidden",
      opacity: expanded?.value ? withDelay(100, withTiming(1)) : withTiming(0),
    }),
    [expanded]
  );
  const animChevronStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          rotate: expanded
            ? withTiming(expanded.value ? "180deg" : "0deg")
            : "0deg",
        },
      ],
    }),
    [expanded]
  );

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
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          colors={[darken(colors.primary, 0.4), darken(colors.secondary, 0.4)]}
          style={{ width: row ? undefined : "100%", ...dieViewCornersStyle }}
        >
          <Animated.View
            style={[
              {
                alignItems: "center",
                justifyContent: "center",
                // Borders (having issues on iOS with those borders applied on the LinearGradient)
                borderWidth: noBorder ? 0 : 1,
                borderRightWidth: noBorder ?? row ? 0 : 1,
                borderTopWidth: noBorder ?? noTopBorder ? 0 : undefined,
                borderBottomWidth:
                  noBorder ?? noBottomBorder ?? !row ? 0 : undefined,
                borderColor: getBorderColor(colors, selected),
                // Corners
                ...dieViewCornersStyle,
              },
              row ? animTopLeftStyle : undefined,
            ]}
          >
            <View
              style={{
                width: row ? 120 : "100%",
                height: 100,
                paddingHorizontal: 2,
                paddingVertical: 2,
              }}
            >
              <ProfileDieRenderer profile={profile} pedestal />
            </View>
            {(transferring ?? transferredProfileUuid === profile.uuid) && (
              <ActivityIndicator
                size="large"
                style={{ position: "absolute" }}
              />
            )}
          </Animated.View>
        </LinearGradient>
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
            description={description}
            numberOfLines={2}
            textStyle={textStyle}
          />
          <ProfileActionsIcons
            profile={profile}
            gap={row ? 10 : 5}
            iconColor={colors.onSurface}
          />
          <Animated.View style={animBottomStyle}>
            <View
              style={{
                position: "absolute",
                width: "100%",
                height: 100,
                paddingBottom: 5,
                justifyContent: "space-between",
              }}
            >
              <ProfileDiceNames
                profile={profile}
                iconColor={colors.onSurface}
              />
              <ProfileLastChanged
                profile={profile}
                iconColor={colors.onSurface}
              />
              <ProfileActions
                profile={profile}
                onAction={onAction}
                transferring={!!transferredProfileUuid}
              />
            </View>
          </Animated.View>
          {row && expanded && (
            <Animated.View
              style={[
                { position: "absolute", bottom: 5, right: 5 },
                animChevronStyle,
              ]}
            >
              <MaterialCommunityIcons
                name="chevron-down"
                size={24}
                color={colors.onSurface}
              />
            </Animated.View>
          )}
        </View>
      </TouchableCard>
    </Animated.View>
  );
}

export function ProfileCardItem({
  itemIndex,
  expandItemIndex,
  ...props
}: {
  itemIndex: number;
  expandItemIndex: SharedValue<number> | undefined;
} & React.ComponentProps<typeof ProfileCard>) {
  const expanded = useDerivedValue(() => itemIndex === expandItemIndex?.value);
  return (
    <ProfileCard expanded={expandItemIndex ? expanded : undefined} {...props} />
  );
}

export interface ProfilesListProps extends ViewProps {
  profiles: Readonly<Profiles.Profile>[];
  selected?: Readonly<Profiles.Profile>;
  groupBy?: ProfilesGrouping;
  sortMode?: SortMode;
  onSelectProfile?: (profile: Readonly<Profiles.Profile>) => void;
  onActivateProfile?: (profile: Readonly<Profiles.Profile>) => void;
}

export function ProfilesList({
  profiles,
  selected,
  groupBy,
  sortMode,
  expandableItems,
  onSelectProfile,
  onActivateProfile,
  style,
  ...props
}: { expandableItems?: boolean } & ProfilesListProps) {
  const expandedIndex = useSharedValue(-1);
  // Reset selection when profiles list changes
  React.useEffect(() => {
    expandedIndex.value = -1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles]);
  const selectProfile = (i: number, p: Readonly<Profiles.Profile>) =>
    expandableItems
      ? (expandedIndex.value = expandedIndex.value === i ? -1 : i)
      : onSelectProfile?.(p);
  const onAction = React.useCallback(
    (action: string, profile: Readonly<Profiles.Profile>) => {
      if (action === "edit") {
        expandedIndex.value = -1;
        onSelectProfile?.(profile);
      } else if (action === "activate") {
        onActivateProfile?.(profile);
      }
    },
    [expandedIndex, onActivateProfile, onSelectProfile]
  );

  const profilesGroups = React.useMemo(
    () => groupAndSortProfiles(profiles, groupBy, sortMode),
    [profiles, groupBy, sortMode]
  );

  let index = 0;
  return (
    <View style={[{ gap: 10 }, style]} {...props}>
      {profilesGroups.map(({ title, values: profiles }, i) => (
        <View key={title + i} style={{ gap: 10 }}>
          <Text variant="headlineSmall">{title}</Text>
          {profiles.map((p) => {
            const i = index;
            ++index;
            return (
              <ProfileCardItem
                key={p.uuid}
                row
                profile={p}
                selected={p === selected}
                fadeInDelay={i * 50}
                itemIndex={i}
                expandItemIndex={expandableItems ? expandedIndex : undefined}
                onPress={() => selectProfile(i, p)}
                onAction={onAction}
              />
            );
          })}
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
