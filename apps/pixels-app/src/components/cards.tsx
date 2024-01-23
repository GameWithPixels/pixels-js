import { usePixelStatus, usePixelValue } from "@systemic-games/pixels-react";
import { Pixel } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View } from "react-native";
import { Text, TextProps } from "react-native-paper";

import { PixelDieRenderer } from "./DieRenderer";
import { PixelBattery } from "./PixelBattery";
import { PixelRssi } from "./PixelRssi";
import { TouchableCardProps, TouchableCard } from "./TouchableCard";
import { BatteryIcon, RssiIcon } from "./icons";

import { PairedPixel } from "~/features/dice/PairedPixel";
import { useActiveProfile, usePairedPixel } from "~/hooks";

function PixelRollState({
  pixel,
  ...props
}: {
  pixel: Pixel;
} & Omit<TextProps<string>, "children">) {
  const [rollState] = usePixelValue(pixel, "rollState");
  const rolling =
    rollState?.state === "rolling" || rollState?.state === "handling";
  return (
    <Text {...props}>
      Die is{" "}
      {rolling ? "rolling" : `on face ${rollState?.face ?? pixel.currentFace}`}
    </Text>
  );
}

export function PixelVCard({
  pairedPixel,
  dieIconRatio = 0.5,
  infoIconsRatio = 0.1,
  miniCards,
  contentStyle,
  onLayout,
  ...props
}: {
  pairedPixel: PairedPixel;
  selected?: boolean;
  dieIconRatio?: number;
  infoIconsRatio?: number;
  miniCards?: boolean;
} & Omit<TouchableCardProps, "children">) {
  const pixel = usePairedPixel(pairedPixel);
  const status = usePixelStatus(pixel);
  const [thePixelName] = usePixelValue(pixel, "name");
  const pixelName = thePixelName ?? pairedPixel.name;
  const disabled = !pixel || status !== "ready";
  const [containerSize, setContainerSize] = React.useState(0);
  const dieRenderWidth = containerSize * dieIconRatio;
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
      {!miniCards && !disabled && (
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
          />
          <RssiIcon value={pixel.rssi} size={infoIconsRatio * containerSize} />
        </View>
      )}
      <View style={{ width: dieRenderWidth, aspectRatio: 1 }}>
        {/* Assign a key based on size to prevent reusing the same view if size changes */}
        <PixelDieRenderer key={dieRenderWidth} pixel={pairedPixel} />
      </View>
      <Text variant={miniCards ? "labelSmall" : "titleMedium"}>
        {status && status !== "ready" && status !== "disconnected"
          ? status
          : pixelName}
      </Text>
      {!miniCards && !disabled && <PixelRollState pixel={pixel} />}
    </TouchableCard>
  );
}

export function PixelHCard({
  pairedPixel,
  ...props
}: {
  pairedPixel: PairedPixel;
} & Omit<TouchableCardProps, "children">) {
  const pixel = usePairedPixel(pairedPixel);
  const status = usePixelStatus(pixel);
  const [thePixelName] = usePixelValue(pixel, "name");
  const pixelName = thePixelName ?? pairedPixel.name;
  const activeProfile = useActiveProfile(pairedPixel);
  const disabled = !pixel || status !== "ready";
  const dieRenderWidth = 70;
  return (
    <TouchableCard row {...props}>
      <View style={{ width: 70, aspectRatio: 1, padding: 5 }}>
        {/* Assign a key based on size to prevent reusing the same view if size changes */}
        <PixelDieRenderer key={dieRenderWidth} pixel={pairedPixel} />
      </View>
      <View
        style={{
          flexGrow: 1,
          marginHorizontal: 10,
          justifyContent: "space-evenly",
        }}
      >
        <Text variant="bodyLarge">{pixelName}</Text>
        <Text>{activeProfile?.name ?? "No Profile!"}</Text>
        {!disabled && <PixelRollState pixel={pixel} />}
      </View>
      {!disabled && (
        <View
          style={{
            flexDirection: "row",
            marginRight: 10,
            alignItems: "center",
            gap: 10,
          }}
        >
          <PixelRssi pixel={pixel} size={22} />
          <PixelBattery pixel={pixel} size={22} />
        </View>
      )}
    </TouchableCard>
  );
}
