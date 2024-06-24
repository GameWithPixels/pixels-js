import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePixelStatus } from "@systemic-games/pixels-react";
import {
  Pixel,
  PixelStatus,
} from "@systemic-games/react-native-pixels-connect";
import { observer } from "mobx-react-lite";
import React from "react";
import { View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { ViewProps } from "react-native-svg/lib/typescript/fabric/utils";

import { FirmwareUpdateBadge } from "./FirmwareUpdateBadge";
import { PairedDieRendererWithRoll } from "./PairedDieRendererWithRoll";
import { PixelBattery } from "./PixelBattery";
import { PixelConnectionStatus } from "./PixelConnectionStatus";
import { PixelRssi } from "./PixelRssi";
import { PixelTransferProgressBar } from "./PixelTransferProgressBar";
import { TouchableCardProps, TouchableCard } from "./TouchableCard";

import { PairedDie } from "~/app/PairedDie";
import { getRollStateAndFaceLabel } from "~/features/profiles";
import {
  useIsModifiedDieProfile,
  useIsPixelRolling,
  usePairedDieProfileUuid,
  useProfile,
  useWatchedPixel,
} from "~/hooks";

const CardLabels = observer(function CardLabels({
  pairedDie,
  pixel,
  compact,
  ...props
}: {
  pairedDie: PairedDie;
  pixel?: Pixel;
  compact?: boolean;
} & ViewProps) {
  const profile = useProfile(usePairedDieProfileUuid(pairedDie));
  const status = usePixelStatus(pixel);
  const isReady = pixel && status === "ready";
  // This hooks triggers a re-render on each roll event
  const rolling = useIsPixelRolling(pixel, status);
  // So we can use the rollState without needing another hook
  const onFace = isReady && pixel.rollState === "onFace";
  const [showRoll, setShowRoll] = React.useState(false);
  const modifiedProfile = useIsModifiedDieProfile(
    pairedDie.profileUuid,
    pairedDie.dieType
  );

  // Show rolling/rolled message for a few seconds
  React.useEffect(() => {
    let id: ReturnType<typeof setTimeout>;
    if (!isReady) {
      setShowRoll(false);
    } else if (rolling) {
      setShowRoll(true);
    } else if (onFace) {
      id = setTimeout(() => setShowRoll(false), 3000);
    }
    return () => id && clearTimeout(id);
  }, [isReady, onFace, rolling]);

  // Animate roll results
  const animValue = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animValue.value }],
  }));
  React.useEffect(() => {
    if (onFace) {
      animValue.value = withSequence(
        withTiming(1.2, {
          duration: 400,
          easing: Easing.out(Easing.ease),
        }),
        withTiming(1, { duration: 200, easing: Easing.in(Easing.ease) })
      );
    }
  }, [animValue, onFace]);

  const { colors } = useTheme();
  return (
    <View {...props}>
      <Text variant="titleSmall" style={{ fontFamily: "LTInternet-Bold" }}>
        {pairedDie.name}
      </Text>
      {!compact && (
        <Text>
          {profile.name}
          {modifiedProfile ? " " : ""}
          {modifiedProfile && (
            <MaterialCommunityIcons
              name="circle-edit-outline"
              size={14}
              color={colors.onSurface}
            />
          )}
        </Text>
      )}
      <Animated.View style={[{ flexDirection: "row" }, animStyle]}>
        <View
          style={{
            flex: 1,
            flexShrink: 1,
            flexDirection: "row",
          }}
        >
          <Text
            variant="labelSmall"
            numberOfLines={1}
            style={modifiedProfile ? { paddingRight: 18 } : undefined}
          >
            {compact && !showRoll
              ? profile.name
              : getRollStateAndFaceLabel(
                  pixel?.rollState,
                  pixel?.currentFace
                ) ?? ""}
          </Text>
          {compact && modifiedProfile && (
            <View>
              <MaterialCommunityIcons
                name="circle-edit-outline"
                size={14}
                color={colors.onSurface}
                style={{ position: "absolute", left: -14 }}
              />
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
});

function PixelStatusIcons({
  pixel,
  status,
  size,
  ...props
}: {
  pixel?: Pixel;
  status?: PixelStatus;
  size: number;
} & ViewProps) {
  const { colors } = useTheme();
  return (
    <View {...props}>
      {status === "ready" ? (
        <>
          <PixelRssi pixel={pixel} size={size} />
          <PixelBattery pixel={pixel} size={size} />
        </>
      ) : (
        <PixelConnectionStatus
          status={status}
          size={size}
          color={colors.onSurface}
        />
      )}
    </View>
  );
}

function PixelVCardContent({
  pairedDie,
  pixel,
  status,
  contentStyle,
}: {
  pairedDie: PairedDie;
  pixel?: Pixel;
  status?: PixelStatus;
  contentStyle?: ViewProps["style"];
} & ViewProps) {
  const isReady = pixel && status === "ready";
  return (
    <View
      style={[
        {
          flex: 1,
          aspectRatio: 1,
          justifyContent: "space-around",
          alignItems: "center",
          margin: 10,
        },
        contentStyle,
      ]}
    >
      <View style={{ width: "60%", aspectRatio: 1 }}>
        {/* Assign a key based on size to prevent reusing the same view if size changes */}
        <PairedDieRendererWithRoll pairedDie={pairedDie} disabled={!isReady} />
      </View>
      <View
        style={{
          width: "100%",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <CardLabels
          compact
          pairedDie={pairedDie}
          pixel={pixel}
          style={{ flexGrow: 1, gap: 3 }}
        />
        <PixelStatusIcons
          pixel={pixel}
          status={status}
          size={20}
          style={{ gap: 5 }}
        />
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
        style={[{ position: "absolute", left: -5, top: -5 }]}
      />
    </View>
  );
}

export function PixelVCard({
  pairedDie,
  contentStyle,
  ...props
}: {
  pairedDie: PairedDie;
  selected?: boolean;
} & Omit<TouchableCardProps, "children">) {
  const pixel = useWatchedPixel(pairedDie);
  const status = usePixelStatus(pixel);
  const flash = useIsPixelRolling(pixel, status);
  return (
    <TouchableCard
      row
      gradientBorder={status === "ready" ? "bright" : "dark"}
      flash={flash}
      // contentStyle={{ aspectRatio: 1 }} Creates problems with the layout
      {...props}
    >
      <PixelVCardContent
        pairedDie={pairedDie}
        pixel={pixel}
        status={status}
        contentStyle={contentStyle}
      />
    </TouchableCard>
  );
}

function PixelHCardContent({
  pairedDie,
  pixel,
  status,
}: {
  pairedDie: PairedDie;
  pixel?: Pixel;
  status?: PixelStatus;
}) {
  const isReady = pixel && status === "ready";
  return (
    <>
      <View style={{ width: 80, aspectRatio: 1, marginLeft: 10, padding: 5 }}>
        {/* Assign a key based on size to prevent reusing the same view if size changes */}
        <PairedDieRendererWithRoll
          key={70}
          pairedDie={pairedDie}
          disabled={!isReady}
        />
      </View>
      <CardLabels
        pairedDie={pairedDie}
        pixel={pixel}
        style={{
          flexGrow: 1,
          alignSelf: "stretch",
          margin: 10,
          justifyContent: "space-around",
        }}
      />
      <PixelStatusIcons
        pixel={pixel}
        status={status}
        size={22}
        style={{
          marginRight: 10,
          alignItems: "center",
          gap: 15,
        }}
      />
      <FirmwareUpdateBadge
        pairedDie={pairedDie}
        style={{ position: "absolute", left: 5, top: 5 }}
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
    </>
  );
}

export function PixelHCard({
  pairedDie,
  contentStyle,
  ...props
}: {
  pairedDie: PairedDie;
} & Omit<TouchableCardProps, "children">) {
  const pixel = useWatchedPixel(pairedDie);
  const status = usePixelStatus(pixel);
  const flash = useIsPixelRolling(pixel, status);
  return (
    <TouchableCard
      row
      gradientBorder={status === "ready" ? "bright" : "dark"}
      flash={flash}
      contentStyle={[{ padding: 5 }, contentStyle]}
      {...props}
    >
      <PixelHCardContent pairedDie={pairedDie} pixel={pixel} status={status} />
    </TouchableCard>
  );
}
