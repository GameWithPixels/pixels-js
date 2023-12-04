/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import {
  FontAwesome,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import {
  PixelProfile,
  PixelDieType,
} from "@systemic-games/pixels-core-connect";
import { range } from "@systemic-games/pixels-core-utils";
import { getBorderRadius } from "@systemic-games/react-native-base-components";
import { LinearGradient } from "expo-linear-gradient";
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
import { Chip, GradientChip } from "./buttons";
import { getBorderColor, getTextColorStyle, makeTransparent } from "./utils";

import AnimationsIcon from "#/icons/navigation/animations";
import SpeakIcon from "#/icons/profiles/speak";
import { useProfile } from "@/hooks";
import { DieRenderer } from "@/render3d/DieRenderer";

export function ProfileCard({
  profile,
  dieType,
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
  profile: PixelProfile;
  transferring?: boolean;
  expanded?: Animated.SharedValue<boolean>;
  dieType: PixelDieType;
  fadeInDuration?: number;
  fadeInDelay?: number;
  footer?: React.ReactNode;
  onAction?: (action: "edit" | "activate") => void;
} & Omit<TouchableCardProps, "children">) {
  const { name, description, group } = useProfile(profile);
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  const dieViewCornersStyle = {
    borderTopLeftRadius: squaredTopBorder ? 0 : borderRadius,
    borderTopRightRadius: row || squaredTopBorder ? 0 : borderRadius,
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
                borderRightWidth: noBorder || row ? 0 : 1,
                borderTopWidth: noBorder || noTopBorder ? 0 : undefined,
                borderBottomWidth: noBorder || noBottomBorder ? 0 : undefined,
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
              <DieRenderer dieType={dieType} colorway="onyxBlack" withStage />
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
            // Borders
            borderWidth: noBorder ? 0 : 1,
            borderLeftWidth: noBorder || row ? 0 : 1,
            borderTopWidth: noBorder || noTopBorder || !row ? 0 : 1,
            borderColor: getBorderColor(colors, selected),
            // Corners
            borderTopRightRadius: !row || squaredTopBorder ? 0 : borderRadius,
            borderBottomLeftRadius:
              row || squaredBottomBorder ? 0 : borderRadius,
            borderBottomRightRadius: squaredBottomBorder ? 0 : borderRadius,
          }}
        >
          <Text
            numberOfLines={1}
            style={textStyle}
            variant={row ? "titleLarge" : "titleMedium"}
          >
            {name}
          </Text>
          {!!description.length && (
            <Text numberOfLines={footer ? 1 : 2} style={textStyle}>
              {description}
            </Text>
          )}
          {footer ?? (
            <View
              style={{
                alignSelf: "flex-start",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: row ? 10 : 5,
                height: 24,
              }}
            >
              {Math.random() > 0.3 && (
                <AnimationsIcon size={16} color={colors.onSurface} />
              )}
              {Math.random() > 0.5 && (
                <SpeakIcon size={16} color={colors.onSurface} />
              )}
              {Math.random() > 0.7 && (
                <MaterialCommunityIcons
                  name="web"
                  size={16}
                  color={colors.onSurface}
                />
              )}
              {Math.random() > 0.8 && (
                <FontAwesome
                  name="file-sound-o"
                  size={16}
                  color={colors.onSurface}
                />
              )}
            </View>
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
              {!!group.length && (
                <View
                  style={{
                    alignSelf: "flex-start",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  <MaterialIcons
                    name="groups"
                    size={24}
                    color={colors.onSurface}
                  />
                  <Text numberOfLines={row ? 1 : 2} style={textStyle}>
                    {group}
                  </Text>
                </View>
              )}
              {Math.random() >= 0 && (
                <View style={{ flexDirection: "row" }}>
                  <MaterialCommunityIcons
                    name="dice-multiple-outline"
                    size={24}
                    color={colors.onSurface}
                  />
                  <Text>Zhobisq, Uffiss</Text>
                </View>
              )}
              <View
                style={{
                  flexDirection: "row",
                  marginRight: 20,
                  justifyContent: "space-between",
                }}
              >
                <GradientChip
                  icon={({ size, color }) => (
                    <MaterialCommunityIcons
                      name="upload"
                      size={size}
                      color={color}
                    />
                  )}
                  onPress={() => onAction?.("activate")}
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
                  onPress={() => onAction?.("edit")}
                >
                  Edit
                </Chip>
              </View>
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
  profiles: PixelProfile[];
  selected?: PixelProfile;
  transferring?: PixelProfile;
  onSelectProfile?: (profile: PixelProfile) => void;
}

export function ProfilesList({
  profiles,
  selected,
  transferring,
  expandableItems,
  onSelectProfile,
  style,
  ...props
}: { expandableItems?: boolean } & ProfilesListProps) {
  const favorites = profiles.filter((p) => p.favorite);
  const expandedIndex = useSharedValue(-1);
  const onPress = (i: number, p: PixelProfile) =>
    expandableItems
      ? (expandedIndex.value = expandedIndex.value === i ? -1 : i)
      : onSelectProfile?.(p);
  const onAction = (action: string, p: PixelProfile) => {
    if (action === "edit") {
      expandedIndex.value = -1;
      onSelectProfile?.(p);
    }
  };

  return (
    <View style={[{ gap: 10 }, style]} {...props}>
      {favorites.length > 0 && (
        <>
          <Text variant="headlineSmall">Favorites</Text>
          {favorites.map((p, i) => (
            <ProfileCardItem
              key={p.uuid}
              row
              profile={p}
              selected={p === selected}
              transferring={p === transferring}
              dieType="d20"
              fadeInDelay={i * 50}
              itemIndex={i}
              expandItemIndex={expandableItems ? expandedIndex : undefined}
              onPress={() => onPress(i, p)}
              onAction={(action) => onAction(action, p)}
            />
          ))}
        </>
      )}
      <Text variant="headlineSmall">Last Week</Text>
      {profiles
        .filter((p, i) => !p.favorite && i < 5)
        .map((p, i) => (
          <ProfileCardItem
            key={p.uuid}
            row
            profile={p}
            selected={p === selected}
            transferring={p === transferring}
            dieType="d20"
            fadeInDelay={(favorites.length + i) * 50}
            itemIndex={favorites.length + i}
            expandItemIndex={expandableItems ? expandedIndex : undefined}
            onPress={() => onPress(favorites.length + i, p)}
            onAction={(action) => onAction(action, p)}
          />
        ))}
      <Text variant="headlineSmall">Last Month</Text>
      {profiles
        .filter((p, i) => !p.favorite && i >= 5)
        .map((p, i) => (
          <ProfileCardItem
            key={p.uuid}
            row
            profile={p}
            selected={p === selected}
            transferring={p === transferring}
            dieType="d20"
            fadeInDelay={(favorites.length + 5 + i) * 50}
            itemIndex={favorites.length + 5 + i}
            expandItemIndex={expandableItems ? expandedIndex : undefined}
            onPress={() => onPress(favorites.length + 5 + i, p)}
            onAction={(action) => onAction(action, p)}
          />
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
          dieType="d20"
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
