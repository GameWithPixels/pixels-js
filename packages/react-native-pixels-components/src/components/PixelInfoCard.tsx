import {
  expandShorthandStyle,
  BaseBoxProps,
  BaseHStack,
  BaseVStack,
} from "@systemic-games/react-native-base-components";
import React from "react";
import { FlexStyle, View } from "react-native";
import {
  TouchableRipple,
  Text,
  TouchableRippleProps,
} from "react-native-paper";

import { BatteryLevel } from "./BatteryLevel";
import { RSSIStrength } from "./RSSIStrength";

export type PixelInfo = Readonly<{
  name: string;
  ledCount: number;
  firmwareDate: Date;
  rssi: number;
  batteryLevel: number; // Percentage
  isCharging: boolean;
  currentFace: number; // Face value (not index)
}>;

/**
 * Props for components displaying dice information.
 */
export interface PixelInfoCardProps extends BaseBoxProps {
  pixel: PixelInfo;
  title?: string;
  onPress?: TouchableRippleProps["onPress"];
  dieRenderer?: () => React.ReactNode;
  dieViewSize?: FlexStyle["width"];
  contentGap?: FlexStyle["gap"];
  infoGap?: FlexStyle["gap"];
  iconSize?: number;
}

/**
 * Squared info card for displaying paired dice information.
 * @param PixelInfoCardProps See {@link PixelInfoCardProps} for props parameters.
 */
export function PixelInfoVCard({
  children,
  pixel,
  title,
  onPress,
  dieRenderer,
  dieViewSize = "80%",
  contentGap = 0,
  infoGap = 10,
  iconSize = 20,
  ...flexProps
}: PixelInfoCardProps) {
  return (
    <TouchableRipple style={expandShorthandStyle(flexProps)} onPress={onPress}>
      <BaseVStack
        w="100%"
        h="100%"
        alignItems="center"
        justifyContent="space-between"
        gap={contentGap}
      >
        {/* Die status info */}
        <BaseHStack w="100%" gap={infoGap} justifyContent="center">
          <BatteryLevel
            level={pixel.batteryLevel}
            isCharging={pixel.isCharging}
            iconSize={iconSize}
          />
          <Text>{pixel.currentFace}</Text>
          <RSSIStrength strength={pixel.rssi} iconSize={iconSize} />
        </BaseHStack>
        {/* Die render */}
        {dieRenderer ? (
          <View style={{ width: dieViewSize, aspectRatio: 1 }}>
            {dieRenderer()}
          </View>
        ) : (
          <Text variant="headlineMedium">{pixel.name}</Text>
        )}
        {/* Profile */}
        {title && <Text variant="headlineSmall">{title}</Text>}
        {children}
      </BaseVStack>
    </TouchableRipple>
  );
}

/**
 * Horizontal info card for displaying scanned unpaired dice information.
 * @param PixelInfoCardProps See {@link PixelInfoCardProps} for props parameters.
 */
export function PixelInfoHCard({
  children,
  pixel,
  onPress,
  dieRenderer,
  dieViewSize = "90%",
  contentGap = 10,
  infoGap = 20,
  iconSize = 20,
  ...flexProps
}: PixelInfoCardProps) {
  return (
    <TouchableRipple style={expandShorthandStyle(flexProps)} onPress={onPress}>
      <BaseHStack w="100%" h="100%" gap={contentGap}>
        {/* Die render */}
        {dieRenderer && (
          <View style={{ height: dieViewSize, aspectRatio: 1 }}>
            {dieRenderer()}
          </View>
        )}
        {/* Die status info */}
        <BaseVStack justifyContent="space-evenly" height="100%">
          <Text variant="headlineSmall">{pixel.name}</Text>
          <BaseHStack gap={infoGap} justifyContent="flex-start">
            <BatteryLevel
              level={pixel.batteryLevel}
              isCharging={pixel.isCharging}
              iconSize={iconSize}
            />
            <Text>{pixel.currentFace}</Text>
            <RSSIStrength strength={pixel.rssi} iconSize={iconSize} />
          </BaseHStack>
        </BaseVStack>
        {children}
      </BaseHStack>
    </TouchableRipple>
  );
}
