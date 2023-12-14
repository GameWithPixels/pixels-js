import { getBorderRadius } from "@systemic-games/react-native-base-components";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Searchbar, Text, TouchableRipple, useTheme } from "react-native-paper";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { useProfilesGroups } from "~/hooks";

function GroupButton({
  group,
  selected,
  onToggle,
}: {
  group: string;
  selected?: boolean;
  onToggle: () => void;
}) {
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      colors={
        selected
          ? [colors.primary, colors.secondary]
          : [colors.surface, colors.surface]
      }
      style={{ borderRadius }}
    >
      <TouchableRipple
        style={{
          paddingVertical: 6,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius,
          borderColor: colors.outline,
        }}
        onPress={onToggle}
      >
        <Text
          style={{
            textAlignVertical: "center",
            marginHorizontal: 16,
          }}
          numberOfLines={1}
          variant="labelLarge"
        >
          {group}
        </Text>
      </TouchableRipple>
    </LinearGradient>
  );
}

function GroupsFilter({
  group,
  toggleGroup,
}: {
  group: string;
  toggleGroup: (group: string) => void;
}) {
  const unsorted = useProfilesGroups();
  const groups = React.useMemo(() => unsorted.sort(), [unsorted]);
  React.useEffect(() => {
    if (!groups.includes(group)) {
      toggleGroup(group);
    }
  }, [group, groups, toggleGroup]);
  return (
    <ScrollView
      horizontal
      style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}
    >
      {groups.length ? (
        groups.map((g) => (
          <GroupButton
            key={g}
            group={g}
            selected={g === group}
            onToggle={() => toggleGroup(g)}
          />
        ))
      ) : (
        <Text variant="labelLarge">Assign a group to your profiles!</Text>
      )}
    </ScrollView>
  );
}

export function AnimatedProfileSearchbar({
  filter,
  setFilter,
  selectedGroup,
  toggleGroup,
  positionY,
  headerHeight,
}: {
  filter: string;
  setFilter: (filter: string) => void;
  selectedGroup: string;
  toggleGroup: (group: string) => void;
  positionY: SharedValue<number>;
  headerHeight: number;
}) {
  const animStyle = useAnimatedStyle(() => {
    const v = 1 - Math.min(1, Math.max(0, positionY.value / headerHeight));
    return {
      height: headerHeight * v,
      transform: [{ translateY: headerHeight * (1 - v) * 0.75 }],
      opacity: v,
    };
  }, [headerHeight, positionY]);
  return (
    <Animated.View style={[animStyle, { overflow: "hidden", gap: 10 }]}>
      <Searchbar
        placeholder="Filter by name, description and die type"
        onChangeText={setFilter}
        value={filter}
      />
      <GroupsFilter group={selectedGroup} toggleGroup={toggleGroup} />
    </Animated.View>
  );
}
