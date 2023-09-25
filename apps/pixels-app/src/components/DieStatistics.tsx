import {
  FontAwesome5,
  MaterialCommunityIcons,
  Ionicons,
  Octicons,
} from "@expo/vector-icons";
import {
  BaseBox,
  BaseHStack,
  Histogram,
  RoundedBox,
} from "@systemic-games/react-native-pixels-components";
import React from "react";
import { View } from "react-native";
import { Divider, Switch, Text, useTheme } from "react-native-paper";

import { AppStyles } from "~/AppStyles";

export function DieStatistics({
  sessionRolls,
  lifetimeRolls,
}: {
  sessionRolls: number[];
  lifetimeRolls: number[];
}) {
  const [showSessionStats, setShowSessionStats] = React.useState(true);
  const sessionRollsCount = React.useMemo(
    () => sessionRolls.reduce((sum, v) => sum + v, 0),
    [sessionRolls]
  );
  const lifetimeRollsCount = React.useMemo(
    () => lifetimeRolls.reduce((sum, v) => sum + v, 0),
    [lifetimeRolls]
  );
  const theme = useTheme();
  return (
    <>
      {/* Header */}
      <BaseHStack w="100%" alignItems="center" gap={5}>
        <Octicons name="graph" size={24} color="white" />
        <Text variant="titleMedium">Die Stats</Text>
        <View style={AppStyles.spacer} />
        <Text>Lifetime</Text>
        <Switch
          onValueChange={() => setShowSessionStats((b) => !b)}
          value={showSessionStats}
        />
        <Text>Session</Text>
      </BaseHStack>
      {/* DiceRolls */}
      <RoundedBox border alignItems="center" p={10} gap={10}>
        <BaseHStack alignItems="baseline" gap={10}>
          <FontAwesome5
            name="dice"
            size={24}
            color={theme.colors.onBackground}
          />
          <Text variant="titleMedium">Rolls</Text>
        </BaseHStack>
        <Text>{showSessionStats ? sessionRollsCount : lifetimeRollsCount}</Text>
        <Divider style={AppStyles.fullWidth} />
        {/* DiceUseTime */}
        <BaseHStack alignItems="baseline" gap={10}>
          <MaterialCommunityIcons
            name="clock"
            size={24}
            color={theme.colors.onBackground}
          />
          <Text variant="titleMedium">Use Time</Text>
        </BaseHStack>
        <Text>{showSessionStats ? "52 minutes" : "12.5 hours"}</Text>
        <Divider style={AppStyles.fullWidth} />
        <BaseHStack alignItems="baseline" gap={10}>
          <Ionicons
            name="stats-chart"
            size={30}
            color={theme.colors.onBackground}
          />
          <Text variant="titleMedium">Rolls Per Face</Text>
        </BaseHStack>
        <BaseBox width="100%" h={150} alignSelf="center">
          <Histogram
            rolls={showSessionStats ? sessionRolls : lifetimeRolls}
            color={theme.colors.onBackground}
          />
        </BaseBox>
      </RoundedBox>
    </>
  );
}
