import { usePixelStatus, usePixelValue } from "@systemic-games/pixels-react";
import {
  Pixel,
  PixelStatus,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View } from "react-native";
import { Badge, BadgeProps, Text } from "react-native-paper";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { PixelDieRenderer } from "./DieRenderer";
import { PixelBattery } from "./PixelBattery";
import { PixelRollState } from "./PixelRollState";
import { PixelRssi } from "./PixelRssi";
import { TouchableCardProps, TouchableCard } from "./TouchableCard";

import { PairedDie } from "~/app/PairedDie";
import { getPixelStatusLabel } from "~/features/profiles";
import {
  useActiveProfile,
  useHasFirmwareUpdate,
  usePairedPixel,
} from "~/hooks";

function AnimatedNameWithRoll({
  pixel,
  status,
  pixelName,
}: {
  pixel?: Pixel;
  status?: PixelStatus;
  pixelName: string;
}) {
  const animValue = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animValue.value }],
  }));

  const [rollText, setRollText] = React.useState<string>();
  const [roll] = usePixelValue(pixel, "roll");
  React.useEffect(() => {
    if (roll) {
      animValue.value = withSequence(
        withTiming(1.2, {
          duration: 400,
          easing: Easing.out(Easing.ease),
        }),
        withTiming(1, { duration: 200, easing: Easing.in(Easing.ease) })
      );
      setRollText("Rolled a " + roll.face);
      const id = setTimeout(() => setRollText(undefined), 3000);
      return () => clearTimeout(id);
    }
  }, [animValue, roll]);

  return (
    <Animated.View style={animStyle}>
      <Text variant="labelSmall">
        {status && status !== "ready" && status !== "disconnected"
          ? getPixelStatusLabel(status)
          : rollText ?? pixelName}
      </Text>
    </Animated.View>
  );
}

function VCardLabel({
  pairedDie,
  pixel,
  miniCards,
}: {
  pairedDie: PairedDie;
  pixel?: Pixel;
  miniCards?: boolean;
}) {
  const status = usePixelStatus(pixel);
  const isReady = pixel && status === "ready";
  const [thePixelName] = usePixelValue(pixel, "name");
  const pixelName = thePixelName ?? pairedDie.name;
  const activeProfile = useActiveProfile(pairedDie);

  return miniCards ? (
    <AnimatedNameWithRoll pixel={pixel} status={status} pixelName={pixelName} />
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
  );
}

function FirmwareUpdateBadge({
  pixel,
  ...props
}: { pixel?: Pixel } & Omit<BadgeProps, "children">) {
  const hasFirmwareUpdate = useHasFirmwareUpdate(pixel);
  return hasFirmwareUpdate ? <Badge {...props}> !</Badge> : null;
}

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
  const [rollEv] = usePixelValue(pixel, "rollState");
  const [containerSize, setContainerSize] = React.useState(0);
  const dieRenderWidth = containerSize * dieIconRatio;

  return (
    <TouchableCard
      flash={rollEv?.state === "rolling" || rollEv?.state === "handling"}
      contentStyle={[
        {
          aspectRatio: 1,
          justifyContent: "space-around",
          backgroundColor: "red",
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
          <PixelBattery pixel={pixel} size={infoIconsRatio * containerSize} />
          <PixelRssi pixel={pixel} size={infoIconsRatio * containerSize} />
        </View>
      )}
      <View style={{ width: dieRenderWidth, aspectRatio: 1 }}>
        {/* Assign a key based on size to prevent reusing the same view if size changes */}
        <PixelDieRenderer key={dieRenderWidth} pixel={pairedDie} />
      </View>
      <VCardLabel pairedDie={pairedDie} pixel={pixel} miniCards={miniCards} />
      <FirmwareUpdateBadge
        pixel={pixel}
        style={{ position: "absolute", right: 5, top: 5 }}
      />
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
  const [rollEv] = usePixelValue(pixel, "rollState");
  const [thePixelName] = usePixelValue(pixel, "name");
  const pixelName = thePixelName ?? pairedDie.name;
  const activeProfile = useActiveProfile(pairedDie);
  const dieRenderWidth = 70;
  return (
    <TouchableCard
      row
      flash={rollEv?.state === "rolling" || rollEv?.state === "handling"}
      {...props}
    >
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
      <FirmwareUpdateBadge
        pixel={pixel}
        style={{ position: "absolute", right: 5, top: 5 }}
      />
    </TouchableCard>
  );
}
