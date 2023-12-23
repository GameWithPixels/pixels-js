import { usePixelStatus, usePixelValue } from "@systemic-games/pixels-react";
import { Pixel } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View } from "react-native";
import { Text, useTheme } from "react-native-paper";

import { TouchableCardProps, TouchableCard } from "./TouchableCard";
import { BatteryIcon, RssiIcon } from "./icons";
import { ProfileDieRenderer } from "./profile";
import { getTextColorStyle, makeTransparent } from "./utils";

import { useActiveProfile } from "~/hooks";

export function PixelDieRenderer({ pixel }: { pixel: Pixel }) {
  const { activeProfile } = useActiveProfile(pixel);
  return (
    <ProfileDieRenderer profile={activeProfile} colorway={pixel.colorway} />
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
  const [pixelName] = usePixelValue(pixel, "name");
  const disabled = status !== "ready";
  const [containerSize, setContainerSize] = React.useState(0);
  const { colors } = useTheme();
  const textStyle =
    pixelName === "+"
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
      {pixelName !== "+" && (
        <View
          style={{
            width: dieIconRatio * containerSize,
            aspectRatio: 1,
          }}
        >
          <PixelDieRenderer pixel={pixel} />
        </View>
      )}
      <Text
        style={textStyle}
        variant={
          pixelName === "+"
            ? "displayLarge"
            : miniCards
              ? "labelSmall"
              : "titleMedium"
        }
      >
        {status === "ready" || status === "disconnected" ? pixelName : status}
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
  const [pixelName] = usePixelValue(pixel, "name");
  const { activeProfile } = useActiveProfile(pixel);
  const disabled = status !== "ready";
  const textStyle = getTextColorStyle(useTheme().colors, disabled);
  return (
    <TouchableCard row {...props}>
      <View style={{ width: 70, aspectRatio: 1, padding: 5 }}>
        <PixelDieRenderer pixel={pixel} />
      </View>
      <View
        style={{
          flexGrow: 1,
          marginHorizontal: 10,
          justifyContent: "space-evenly",
        }}
      >
        <Text variant="bodyLarge" style={textStyle}>
          {pixelName}
        </Text>
        <Text style={textStyle}>{activeProfile?.name ?? "No Profile!"}</Text>
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
