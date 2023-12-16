import { MaterialCommunityIcons } from "@expo/vector-icons";
import { range } from "@systemic-games/pixels-core-utils";
import { getBorderRadius } from "@systemic-games/react-native-base-components";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { LinearGradient } from "expo-linear-gradient";
import { observer } from "mobx-react-lite";
import React from "react";
import { View, ViewProps } from "react-native";
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
import { getBorderColor, getTextColorStyle, makeTransparent } from "./utils";

import { useAppSelector } from "~/app/hooks";
import { DieRenderer } from "~/features/render3d/DieRenderer";
import {
  groupAndSortProfiles,
  ProfilesGrouping,
  SortMode,
} from "~/features/sortingOptions";

const ProfileNameAndDescription = observer(function ({
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

const ProfileDiceNames = observer(function ({
  profile,
  iconColor,
}: {
  profile: Readonly<Profiles.Profile>;
  iconColor: string;
}) {
  const diceNames = useAppSelector((state) => state.pairedDice.diceData)
    .filter((d) => d.profileUuid === profile.uuid)
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
      <Text>{diceNames.length ? diceNames.join(", ") : "Not in use"}</Text>
    </View>
  );
});

function ProfileActions({
  profile,
  onAction,
}: {
  profile: Readonly<Profiles.Profile>;
  onAction?: (
    action: "edit" | "activate",
    profile: Readonly<Profiles.Profile>
  ) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        marginRight: 20,
        justifyContent: "space-between",
      }}
    >
      <GradientChip
        icon={({ size, color }) => (
          <MaterialCommunityIcons name="upload" size={size} color={color} />
        )}
        onPress={() => onAction?.("activate", profile)}
      >
        Activate
      </GradientChip>
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

const ProfileActionsIcons = observer(function ({
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

export function ProfileCard({
  profile,
  row,
  disabled,
  selected,
  expanded,
  transferring,
  squaredTopBorder,
  squaredBottomBorder,
  noBorder,
  noTopBorder,
  noBottomBorder,
  fadeInDuration,
  fadeInDelay,
  onAction,
  footer,
  style,
  contentStyle,
  ...props
}: {
  profile: Readonly<Profiles.Profile>;
  transferring?: boolean;
  expanded?: SharedValue<boolean>;
  fadeInDuration?: number;
  fadeInDelay?: number;
  footer?: React.ReactNode;
  onAction?: (
    action: "edit" | "activate",
    profile: Readonly<Profiles.Profile>
  ) => void;
} & Omit<TouchableCardProps, "children">) {
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
          colors={[
            makeTransparent(colors.primary, 0.2),
            makeTransparent(colors.secondary, 0.2),
          ]}
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
                borderBottomWidth: noBorder ?? noBottomBorder ? 0 : undefined,
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
              <DieRenderer
                dieType={profile.dieType}
                colorway="onyxBlack"
                withStage
              />
            </View>
            {transferring && (
              <ActivityIndicator style={{ position: "absolute" }} />
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
            numberOfLines={footer ? 1 : 2}
            textStyle={textStyle}
          />
          {footer ?? (
            <ProfileActionsIcons
              profile={profile}
              gap={row ? 10 : 5}
              iconColor={colors.onSurface}
            />
          )}
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
              <ProfileActions profile={profile} onAction={onAction} />
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
  transferring?: Readonly<Profiles.Profile>;
  onSelectProfile?: (profile: Readonly<Profiles.Profile>) => void;
}

export function ProfilesList({
  profiles,
  selected,
  groupBy,
  sortMode,
  transferring,
  expandableItems,
  onSelectProfile,
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
      }
    },
    [expandedIndex, onSelectProfile]
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
                transferring={p === transferring}
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
  transferring,
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
          transferring={p === transferring}
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
  transferring,
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
          transferring={transferring}
          onSelectProfile={onSelectProfile}
        />
      ))}
    </View>
  );
}
