import { usePixelEvent, usePixelStatus } from "@systemic-games/pixels-react";
import {
  Pixel,
  PixelStatus,
} from "@systemic-games/react-native-pixels-connect";
import { observer } from "mobx-react-lite";
import React from "react";
import { StyleProp, TextStyle, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { FirmwareUpdateBadge } from "./FirmwareUpdateBadge";
import { PairedDieRenderer } from "./PairedDieRenderer";
import { PixelBattery } from "./PixelBattery";
import { PixelRollState } from "./PixelRollState";
import { PixelRssi } from "./PixelRssi";
import { PixelTransferProgressBar } from "./PixelTransferProgressBar";
import { TouchableCardProps, TouchableCard } from "./TouchableCard";

import { PairedDie } from "~/app/PairedDie";
import { getPixelStatusLabel } from "~/features/profiles";
import { usePairedDieProfileUuid, useProfile, useWatchedPixel } from "~/hooks";

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
  const [rollEv] = usePixelEvent(pixel, "roll");
  React.useEffect(() => {
    if (rollEv) {
      animValue.value = withSequence(
        withTiming(1.2, {
          duration: 400,
          easing: Easing.out(Easing.ease),
        }),
        withTiming(1, { duration: 200, easing: Easing.in(Easing.ease) })
      );
      setRollText("Rolled a " + rollEv.face);
      const id = setTimeout(() => setRollText(undefined), 3000);
      return () => clearTimeout(id);
    }
  }, [animValue, rollEv]);

  const { colors } = useTheme();
  const color =
    status === "ready" ? colors.onSurface : colors.onSurfaceDisabled;
  return (
    <Animated.View style={animStyle}>
      <Text variant="labelSmall" style={{ color }}>
        {status === "ready" && rollText ? rollText : pixelName}
      </Text>
    </Animated.View>
  );
}

const DieProfileName = observer(function ProfileName({
  pairedDie,
  style,
}: {
  pairedDie: PairedDie;
  style?: StyleProp<TextStyle>;
}) {
  const profile = useProfile(usePairedDieProfileUuid(pairedDie));
  return <Text style={style}>{profile.name}</Text>;
});

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
  return miniCards ? (
    <AnimatedNameWithRoll
      pixel={pixel}
      status={status}
      pixelName={pairedDie.name}
    />
  ) : (
    <>
      <Text variant="titleMedium">{pairedDie.name}</Text>
      <DieProfileName pairedDie={pairedDie} />
      {pixel && status === "ready" ? (
        <PixelRollState pixel={pixel} />
      ) : (
        <Text>{getPixelStatusLabel(status)}</Text>
      )}
    </>
  );
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
  const pixel = useWatchedPixel(pairedDie);
  const status = usePixelStatus(pixel);
  const isReady = pixel && status === "ready";
  const [rollEv] = usePixelEvent(pixel, "roll");
  const [containerSize, setContainerSize] = React.useState(0);
  const dieRenderWidth = containerSize * dieIconRatio;

  return (
    <TouchableCard
      flash={
        status === "ready" &&
        (rollEv?.state === "rolling" || rollEv?.state === "handling")
      }
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
          <PixelBattery pixel={pixel} size={infoIconsRatio * containerSize} />
          <PixelRssi pixel={pixel} size={infoIconsRatio * containerSize} />
        </View>
      )}
      <View style={{ width: dieRenderWidth, aspectRatio: 1 }}>
        {/* Assign a key based on size to prevent reusing the same view if size changes */}
        <PairedDieRenderer key={dieRenderWidth} pairedDie={pairedDie} />
      </View>
      <View style={{ width: "100%", alignItems: "center" }}>
        <VCardLabel pairedDie={pairedDie} pixel={pixel} miniCards={miniCards} />
        {pixel && (
          <PixelTransferProgressBar
            pixel={pixel}
            style={{
              position: "absolute",
              width: "99%",
              height: 3,
              top: -10,
              padding: 1,
            }}
          />
        )}
      </View>
      <FirmwareUpdateBadge
        pairedDie={pairedDie}
        style={[
          { position: "absolute", top: 5 },
          miniCards ? { right: 5 } : { left: 5 },
        ]}
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
  const pixel = useWatchedPixel(pairedDie);
  const status = usePixelStatus(pixel);
  const isReady = pixel && status === "ready";
  const [rollEv] = usePixelEvent(pixel, "roll");
  const dieRenderWidth = 70;
  return (
    <TouchableCard
      row
      flash={
        status === "ready" &&
        (rollEv?.state === "rolling" || rollEv?.state === "handling")
      }
      {...props}
    >
      <View style={{ width: 70, aspectRatio: 1, padding: 5 }}>
        {/* Assign a key based on size to prevent reusing the same view if size changes */}
        <PairedDieRenderer key={dieRenderWidth} pairedDie={pairedDie} />
      </View>
      <View
        style={{
          flexGrow: 1,
          alignSelf: "stretch",
          marginHorizontal: 10,
          justifyContent: "space-around",
        }}
      >
        <Text variant="bodyLarge">{pairedDie.name}</Text>
        <DieProfileName pairedDie={pairedDie} />
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
        pairedDie={pairedDie}
        style={{ position: "absolute", right: 5, top: 5 }}
      />
      {pixel && (
        <PixelTransferProgressBar
          pixel={pixel}
          style={{
            position: "absolute",
            width: "99%",
            height: 3,
            top: 3,
            padding: 1,
          }}
        />
      )}
    </TouchableCard>
  );
}
