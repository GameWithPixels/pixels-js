import {
  expandShorthandStyle,
  FastBoxProps,
  FastHStack,
  FastVStack,
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

export interface PixelInfo {
  readonly name: string;
  readonly ledCount: number;
  readonly firmwareDate: Date;
  readonly rssi: number;
  readonly batteryLevel: number; // Percentage
  readonly isCharging: boolean;
  readonly currentFace: number; // Face value (not index)
}

/**
 * Props for components displaying dice information.
 */
export interface PixelInfoCardProps extends FastBoxProps {
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
      <FastVStack
        w="100%"
        h="100%"
        alignItems="center"
        justifyContent="space-between"
        gap={contentGap}
      >
        {/* Die status info */}
        <FastHStack w="100%" gap={infoGap} justifyContent="center">
          <BatteryLevel
            level={pixel.batteryLevel}
            isCharging={pixel.isCharging}
            iconSize={iconSize}
          />
          <Text>{pixel.currentFace}</Text>
          <RSSIStrength strength={pixel.rssi} iconSize={iconSize} />
        </FastHStack>
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
      </FastVStack>
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
      <FastHStack w="100%" h="100%" gap={contentGap}>
        {/* Die render */}
        {dieRenderer && (
          <View style={{ height: dieViewSize, aspectRatio: 1 }}>
            {dieRenderer()}
          </View>
        )}
        {/* Die status info */}
        <FastVStack justifyContent="space-evenly" height="100%">
          <Text variant="headlineSmall">{pixel.name}</Text>
          <FastHStack gap={infoGap} justifyContent="flex-start">
            <BatteryLevel
              level={pixel.batteryLevel}
              isCharging={pixel.isCharging}
              iconSize={iconSize}
            />
            <Text>{pixel.currentFace}</Text>
            <RSSIStrength strength={pixel.rssi} iconSize={iconSize} />
          </FastHStack>
        </FastVStack>
        {children}
      </FastHStack>
    </TouchableRipple>
  );
}
