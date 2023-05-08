import {
  BaseStyles,
  FastHStack,
  FastVStack,
  PixelAppPage,
  RoundedBox,
} from "@systemic-games/react-native-pixels-components";
import { Color, getPixel } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { ScrollView } from "react-native";
import { Button, Text } from "react-native-paper";

import { PixelAdvancedSettingsScreenProps } from "~/navigation";

export default function PixelAdvancedSettingsScreen(
  props: PixelAdvancedSettingsScreenProps
) {
  const { pixelId } = props.route.params;
  const pixel = getPixel(pixelId);
  return (
    <PixelAppPage>
      <ScrollView style={BaseStyles.fullSizeFlex}>
        <FastVStack gap={10}>
          {/* Firmware */}
          <RoundedBox border p={10} gap={5}>
            <Text variant="titleLarge">Firmware</Text>
            <Text>{pixel.firmwareDate.toUTCString()}</Text>
            <Button mode="contained-tonal" icon="update">
              Update
            </Button>
          </RoundedBox>
          {/* Storage Info */}
          <RoundedBox border p={10} gap={5}>
            <Text variant="titleLarge">Die Storage</Text>
            <FastHStack alignItems="baseline">
              <Text variant="bodyLarge">Available: </Text>
              <Text>2045 bytes</Text>
            </FastHStack>
            <FastHStack alignItems="baseline">
              <Text variant="bodyLarge">Total storage: </Text>
              <Text>6349 bytes</Text>
            </FastHStack>
            <FastHStack alignItems="baseline">
              <Text variant="bodyLarge">Animations: </Text>
              <Text>2834 bytes</Text>
            </FastHStack>
            <FastHStack alignItems="baseline">
              <Text variant="bodyLarge">Designs: </Text>
              <Text>3123 bytes</Text>
            </FastHStack>
            <FastHStack alignItems="baseline">
              <Text variant="bodyLarge">Rules: </Text>
              <Text>392 bytes</Text>
            </FastHStack>
          </RoundedBox>
          {/* Advanced Options */}
          <Button mode="contained-tonal" icon="target">
            Calibrate
          </Button>
          <Button
            mode="contained-tonal"
            icon="restart"
            onPress={() => pixel.blink(Color.red)}
          >
            Reboot
          </Button>
        </FastVStack>
      </ScrollView>
    </PixelAppPage>
  );
}
