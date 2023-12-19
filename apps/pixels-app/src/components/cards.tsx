import { usePixelStatus } from "@systemic-games/pixels-react";
import {
  Pixel,
  PixelDieType,
  ScannedPixel,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View, ViewProps } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Animated, { AnimatedProps } from "react-native-reanimated";

import { TouchableCardProps, TouchableCard } from "./TouchableCard";
import { BatteryIcon, DieWireframe, RssiIcon } from "./icons";
import { getTextColorStyle, makeTransparent } from "./utils";

import { DieRenderer } from "~/features/render3d/DieRenderer";
import { useActiveProfile } from "~/hooks";

export function ScannedPixelCard({
  scannedPixel,
  ...props
}: {
  scannedPixel: ScannedPixel;
} & Omit<TouchableCardProps, "children">) {
  return (
    <TouchableCard {...props}>
      <View style={{ width: 70, aspectRatio: 1 }}>
        <DieRenderer
          dieType={scannedPixel.dieType}
          colorway={scannedPixel.colorway}
        />
      </View>
    </TouchableCard>
  );
}

export function PixelVCard({
  pixel,
  dieIconRatio = 0.5,
  infoIconsRatio = 0.1,
  miniCards,
  contentStyle,
  onLayout,
  ...props
}: {
  pixel: Pixel;
  selected?: boolean;
  dieIconRatio?: number;
  infoIconsRatio?: number;
  miniCards?: boolean;
} & Omit<TouchableCardProps, "children">) {
  const status = usePixelStatus(pixel);
  const disabled = status !== "ready";
  const [containerSize, setContainerSize] = React.useState(0);
  const { colors } = useTheme();
  const textStyle =
    pixel.name === "+"
      ? { color: makeTransparent(colors.onPrimary, 0.8) }
      : getTextColorStyle(colors, disabled);
  return (
    <TouchableCard
      contentStyle={[
        {
          aspectRatio: 1,
          justifyContent: "space-around",
        },
        contentStyle,
      ]}
      onLayout={(ev) => {
        setContainerSize(ev.nativeEvent.layout.width);
        onLayout?.(ev);
      }}
      {...props}
    >
      {!miniCards && (
        <View
          style={{
            alignSelf: "flex-end",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <BatteryIcon
            value={pixel.batteryLevel}
            size={infoIconsRatio * containerSize}
            disabled={disabled}
          />
          <RssiIcon
            value={pixel.rssi}
            size={infoIconsRatio * containerSize}
            disabled={disabled}
          />
        </View>
      )}
      {pixel.name !== "+" && (
        <View
          style={{
            width: dieIconRatio * containerSize,
            aspectRatio: 1,
          }}
        >
          <DieRenderer dieType={pixel.dieType} colorway={pixel.colorway} />
        </View>
      )}
      <Text
        style={textStyle}
        variant={
          pixel.name === "+"
            ? "displayLarge"
            : miniCards
              ? "titleSmall"
              : "titleMedium"
        }
      >
        {status === "ready" || status === "disconnected" ? pixel.name : status}
      </Text>
    </TouchableCard>
  );
}

export function PixelHCard({
  pixel,
  ...props
}: {
  pixel: Pixel;
} & Omit<TouchableCardProps, "children">) {
  const status = usePixelStatus(pixel);
  const { activeProfile } = useActiveProfile(pixel);
  const disabled = status !== "ready";
  const textStyle = getTextColorStyle(useTheme().colors, disabled);
  return (
    <TouchableCard row {...props}>
      <View style={{ width: 70, aspectRatio: 1, padding: 5 }}>
        <DieRenderer dieType={pixel.dieType} colorway={pixel.colorway} />
      </View>
      <View
        style={{
          flexGrow: 1,
          marginHorizontal: 10,
          justifyContent: "space-evenly",
        }}
      >
        <Text variant="bodyLarge" style={textStyle}>
          {pixel.name}
        </Text>
        <Text>{activeProfile?.name ?? "No Profile!"}</Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          marginRight: 10,
          alignItems: "center",
          gap: 10,
        }}
      >
        <BatteryIcon value={pixel.batteryLevel} size={22} disabled={disabled} />
        <RssiIcon value={pixel.rssi} size={22} disabled={disabled} />
      </View>
    </TouchableCard>
  );
}

export function DieWireframeCard({
  children,
  dieType,
  style,
  ...props
}: ViewProps & { dieType: PixelDieType }) {
  return (
    <View
      style={[{ flexDirection: "row", alignItems: "center", gap: 20 }, style]}
      {...props}
    >
      <DieWireframe size={40} dieType={dieType} />
      {typeof children === "string" ? (
        <Text variant="bodyLarge" children={children} />
      ) : (
        <View children={children} />
      )}
    </View>
  );
}

// For some reason DieWireframeCard doesn't work with "withAnimated()"
export function AnimatedDieWireframeCard({
  children,
  dieType,
  style,
  ...props
}: AnimatedProps<Omit<ViewProps, "children">> &
  React.PropsWithChildren<{ dieType: PixelDieType }>) {
  return (
    <Animated.View
      style={[{ flexDirection: "row", alignItems: "center", gap: 20 }, style]}
      {...props}
    >
      <DieWireframe size={40} dieType={dieType} />
      {typeof children === "string" ? (
        <Text variant="bodyLarge" children={children} />
      ) : (
        <View style={{ flex: 1 }} children={children} />
      )}
    </Animated.View>
  );
}
