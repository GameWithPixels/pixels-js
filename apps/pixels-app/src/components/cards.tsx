import { usePixelStatus, usePixelValue } from "@systemic-games/pixels-react";
import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";

import { PixelDieRenderer } from "./DieRenderer";
import { PixelBattery } from "./PixelBattery";
import { PixelRollState } from "./PixelRollState";
import { PixelRssi } from "./PixelRssi";
import { TouchableCardProps, TouchableCard } from "./TouchableCard";
import { BatteryIcon, RssiIcon } from "./icons";

import { PairedDie } from "~/app/PairedDie";
import { getPixelStatusLabel } from "~/features/profiles";
import { useActiveProfile, usePairedPixel } from "~/hooks";

export function PixelVCard({
  pairedDie,
  dieIconRatio = 0.5,
  infoIconsRatio = 0.1,
  miniCards,
  contentStyle,
  onLayout,
  ...props
}: {
  pairedDie: PairedDie;
  selected?: boolean;
  dieIconRatio?: number;
  infoIconsRatio?: number;
  miniCards?: boolean;
} & Omit<TouchableCardProps, "children">) {
  const pixel = usePairedPixel(pairedDie);
  const status = usePixelStatus(pixel);
  const isReady = pixel && status === "ready";
  const [thePixelName] = usePixelValue(pixel, "name");
  const pixelName = thePixelName ?? pairedDie.name;
  const activeProfile = useActiveProfile(pairedDie);
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
      {!miniCards && isReady && (
        <View
          style={{
            position: "absolute",
            top: 5,
            right: 5,
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
        <PixelDieRenderer key={dieRenderWidth} pixel={pairedDie} />
      </View>
      {miniCards ? (
        <Text variant="labelSmall">
          {status && status !== "ready" && status !== "disconnected"
            ? getPixelStatusLabel(status)
            : pixelName}
        </Text>
      ) : (
        <>
          <Text variant="titleMedium">{pixelName}</Text>
          <Text>{activeProfile?.name ?? "No Profile!"}</Text>
          {isReady ? (
            <PixelRollState pixel={pixel} />
          ) : (
            <Text>{getPixelStatusLabel(status)}</Text>
          )}
        </>
      )}
    </TouchableCard>
  );
}

export function PixelHCard({
  pairedDie,
  ...props
}: {
  pairedDie: PairedDie;
} & Omit<TouchableCardProps, "children">) {
  const pixel = usePairedPixel(pairedDie);
  const status = usePixelStatus(pixel);
  const isReady = pixel && status === "ready";
  const [thePixelName] = usePixelValue(pixel, "name");
  const pixelName = thePixelName ?? pairedDie.name;
  const activeProfile = useActiveProfile(pairedDie);
  const dieRenderWidth = 70;
  return (
    <TouchableCard row {...props}>
      <View style={{ width: 70, aspectRatio: 1, padding: 5 }}>
        {/* Assign a key based on size to prevent reusing the same view if size changes */}
        <PixelDieRenderer key={dieRenderWidth} pixel={pairedDie} />
      </View>
      <View
        style={{
          flexGrow: 1,
          alignSelf: "stretch",
          marginHorizontal: 10,
          justifyContent: "space-around",
        }}
      >
        <Text variant="bodyLarge">{pixelName}</Text>
        <Text>{activeProfile?.name ?? "No Profile!"}</Text>
        {isReady ? (
          <PixelRollState pixel={pixel} />
        ) : (
          <Text>{getPixelStatusLabel(status)}</Text>
        )}
      </View>
      {isReady && (
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
