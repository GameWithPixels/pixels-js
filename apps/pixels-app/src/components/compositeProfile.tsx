import { MaterialCommunityIcons } from "@expo/vector-icons";
import { range } from "@systemic-games/pixels-core-utils";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { observer } from "mobx-react-lite";
import React from "react";
import { View, ViewProps } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Animated, { FadeIn } from "react-native-reanimated";

import { TouchableCardProps, TouchableCard } from "./TouchableCard";
import { getBorderColor } from "./colors";

import { getBorderRadius } from "~/features/getBorderRadius";

const ProfileNameAndDescription = observer(function ProfileNameAndDescription({
  profile,
  modified,
  row,
  textStyle,
}: {
  profile: Readonly<Profiles.CompositeProfile>;
  modified?: boolean;
  row?: boolean;
  textStyle: { color: string } | undefined;
}) {
  const { colors } = useTheme();
  return (
    <>
      <Text
        numberOfLines={1}
        style={textStyle}
        variant={row ? "titleLarge" : "titleMedium"}
      >
        {profile.formula?.trim()?.length ? profile.formula : profile.name}
      </Text>
      {/* {modified && (
        <MaterialCommunityIcons
          name="circle-edit-outline"
          size={20}
          color={colors.onSurface}
          style={{ position: "absolute", right: 10, top: 10 }}
        />
      )}
      {!!profile.description.length && (
        <Text numberOfLines={2} variant="bodyMedium" style={textStyle}>
          {profile.description}
        </Text>
      )}
      {!!profile.formula?.length && (
        <Text numberOfLines={1} variant="bodyMedium" style={textStyle}>
          Formula: {profile.formula}
        </Text>
      )} */}
    </>
  );
});

export interface CompositeProfileCardProps
  extends Omit<TouchableCardProps, "children"> {
  profile: Readonly<Profiles.CompositeProfile>;
  modified?: boolean;
  fadeInDuration?: number;
  fadeInDelay?: number;
}

export function CompositeProfileCard({
  profile,
  vertical,
  disabled,
  selected,
  modified,
  squaredTopBorder,
  squaredBottomBorder,
  noBorder,
  fadeInDuration,
  fadeInDelay,
  style,
  contentStyle,
  ...props
}: { vertical?: boolean } & Omit<
  CompositeProfileCardProps,
  "children" | "row" | "noTopBorder" | "noBottomBorder"
>) {
  noBorder = true;
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <Animated.View
      entering={FadeIn.duration(fadeInDuration ?? 300).delay(fadeInDelay ?? 0)}
    >
      <TouchableCard
        row={!vertical}
        disabled={disabled}
        style={style}
        contentStyle={[{ padding: 0 }, contentStyle]}
        gradientBorder="bright"
        squaredTopBorder={squaredTopBorder}
        squaredBottomBorder={squaredBottomBorder}
        noBorder
        {...props}
      >
        <View
          style={{
            alignSelf: "stretch",
            flex: 1,
            flexDirection: "column",
            justifyContent: "space-around",
            paddingHorizontal: vertical ? 5 : 20,
            paddingVertical: vertical ? 0 : 20,
            // Borders
            borderWidth: noBorder ? 0 : 1,
            borderColor: getBorderColor(colors, selected),
            // Corners
            borderTopRightRadius:
              !!vertical || squaredTopBorder ? 0 : borderRadius,
            borderBottomLeftRadius:
              !vertical || squaredBottomBorder ? 0 : borderRadius,
            borderBottomRightRadius: squaredBottomBorder ? 0 : borderRadius,
          }}
        >
          <ProfileNameAndDescription
            profile={profile}
            modified={modified}
            row={!vertical}
            textStyle={{
              color: disabled ? colors.onSurfaceDisabled : colors.onSurface,
            }}
          />
        </View>
      </TouchableCard>
    </Animated.View>
  );
}

export interface CompositeProfilesListProps extends ViewProps {
  profiles: Readonly<Profiles.CompositeProfile>[];
  selected?: Readonly<Profiles.CompositeProfile>;
  onSelectProfile?: (profile: Readonly<Profiles.CompositeProfile>) => void;
  onLongPressProfile?: (profile: Readonly<Profiles.CompositeProfile>) => void;
}

export function CompositeProfilesList({
  profiles,
  selected,
  onSelectProfile,
  onLongPressProfile,
  style,
  ...props
}: CompositeProfilesListProps) {
  return (
    <View style={[{ gap: 20 }, style]} {...props}>
      {profiles.map((p, i) => (
        <CompositeProfileCard
          key={i} // Using the index rather than the UUID lets react re-use the component when switching animations
          profile={p}
          selected={p === selected}
          fadeInDelay={i * 50}
          onPress={onSelectProfile ? () => onSelectProfile(p) : undefined}
          onLongPress={
            onLongPressProfile ? () => onLongPressProfile(p) : undefined
          }
        />
      ))}
    </View>
  );
}

function CompositeProfilesColumn({
  profiles,
  selected,
  onSelectProfile,
  onLongPressProfile,
  style,
  ...props
}: CompositeProfilesListProps) {
  return (
    <View
      key="profiles-column"
      style={[{ flex: 1, gap: 10 }, style]}
      {...props}
    >
      {profiles.map((p, i) => (
        <CompositeProfileCard
          key={i} // Using the index rather than the UUID lets react re-use the component when switching animations
          profile={p}
          vertical
          selected={p === selected}
          fadeInDuration={500}
          fadeInDelay={i * 100}
          contentStyle={{ height: 200 }}
          onPress={() => onSelectProfile?.(p)}
          onLongPress={
            onLongPressProfile ? () => onLongPressProfile(p) : undefined
          }
        />
      ))}
    </View>
  );
}

export function CompositeProfilesGrid({
  profiles,
  selected,
  numColumns = 3,
  onSelectProfile,
  onLongPressProfile,
  style,
  ...props
}: {
  numColumns?: number;
} & CompositeProfilesListProps) {
  return (
    <View style={[{ flexDirection: "row", gap: 10 }, style]} {...props}>
      {range(numColumns).map((col) => (
        <CompositeProfilesColumn
          key={col}
          profiles={profiles.filter((_, i) => i % numColumns === col)}
          selected={selected}
          onSelectProfile={onSelectProfile}
          onLongPressProfile={onLongPressProfile}
        />
      ))}
    </View>
  );
}
