import { PixelScannerStatus } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View, ViewProps } from "react-native";
import { Card, Text } from "react-native-paper";
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { AnimatedMaterialCommunityIcons } from "~/components/animated";
import { TightTextButton } from "~/components/buttons";

function getMissingDiceText(
  missingDice: readonly { name: string }[]
): React.ReactNode {
  return `Couldn't find ${missingDice.reduce((acc, d, i) => {
    if (i === 0) {
      return d.name;
    } else {
      return acc + (i >= missingDice.length - 1 ? " and " : ", ") + d.name;
    }
  }, "")}.`;
}

export function TapToReconnect({
  scannerStatus,
  missingDice,
  hasConnectedDie,
  onPress,
  ...props
}: {
  scannerStatus: PixelScannerStatus;
  missingDice: readonly { name: string }[];
  hasConnectedDie: boolean;
  onPress: () => void;
} & ViewProps) {
  // Reconnect animation
  const connectProgress = useSharedValue(0);
  React.useEffect(() => {
    if (scannerStatus === "scanning") {
      connectProgress.value = withRepeat(
        withTiming(360, { duration: 2000 }),
        -1
      );
    } else {
      cancelAnimation(connectProgress);
      connectProgress.value = 0;
    }
  }, [connectProgress, scannerStatus]);
  const connectAnimStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: connectProgress.value + "deg" }],
  }));

  return (
    <View {...props}>
      {hasConnectedDie ? (
        <Text style={{ marginLeft: 8 }}>{getMissingDiceText(missingDice)}</Text>
      ) : (
        <Card style={{ width: "100%", marginBottom: 10 }}>
          <Card.Title title="Could not connect to any of your dice" />
          <Card.Content>
            <Text variant="bodyMedium">
              Check that your dice are turned on and not connected to another
              device.
            </Text>
          </Card.Content>
        </Card>
      )}
      <TightTextButton
        icon={({ size, color }) => (
          <AnimatedMaterialCommunityIcons
            name="refresh"
            size={size}
            color={color}
            style={connectAnimStyle}
          />
        )}
        style={{ alignSelf: "flex-start" }}
        onPress={onPress}
      >
        {scannerStatus === "scanning"
          ? "Trying to connect..."
          : "Tap to try again to connect."}
      </TightTextButton>
    </View>
  );
}
