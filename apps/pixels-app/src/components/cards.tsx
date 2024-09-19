import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePixelStatus } from "@systemic-games/pixels-react";
import { getBorderRadius } from "@systemic-games/react-native-pixels-components";
import {
  Pixel,
  PixelStatus,
} from "@systemic-games/react-native-pixels-connect";
import { LinearGradient } from "expo-linear-gradient";
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
import { GradientButton } from "./buttons";
import { DieWireframe } from "./icons";

import { PairedDie } from "~/app/PairedDie";
import { getRollStateAndFaceLabel } from "~/features/profiles";
import {
  useIsModifiedDieProfile,
  useIsPixelRolling,
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
  const profile = useProfile(pairedDie.profileUuid);
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
      <Text
        numberOfLines={1}
        variant="titleSmall"
        style={{ fontFamily: "LTInternet-Bold" }}
      >
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
            numberOfLines={1}
            variant="labelSmall"
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
  selectable,
  contentStyle,
}: {
  pairedDie: PairedDie;
  pixel?: Pixel;
  status?: PixelStatus;
  selectable?: boolean;
  contentStyle?: ViewProps["style"];
} & ViewProps) {
  const isReady = pixel && status === "ready";
  return (
    <View
      style={[
        {
          flex: 1,
          aspectRatio: selectable ? undefined : 1,
          justifyContent: "space-around",
          alignItems: "center",
          marginVertical: 10,
          marginHorizontal: selectable ? 0 : 10,
        },
        contentStyle,
      ]}
    >
      {selectable ? (
        <DieWireframe dieType={pairedDie.dieType} size={70} />
      ) : (
        <View style={{ width: "60%", aspectRatio: 1 }}>
          {/* Assign a key based on size to prevent reusing the same view if size changes */}
          <PairedDieRendererWithRoll
            pairedDie={pairedDie}
            disabled={!isReady}
          />
        </View>
      )}
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
          style={{
            flexGrow: 1,
            gap: 3,
            alignItems: selectable ? "center" : "flex-start",
          }}
        />
        {!selectable && (
          <PixelStatusIcons
            pixel={pixel}
            status={status}
            size={20}
            style={{ gap: 5 }}
          />
        )}
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
      {selectable && (
        <PixelStatusIcons
          pixel={pixel}
          status={status}
          size={20}
          style={{ flexDirection: "row", gap: 5 }}
        />
      )}
      <FirmwareUpdateBadge
        pairedDie={pairedDie}
        style={[{ position: "absolute", left: -5, top: -5 }]}
      />
    </View>
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

export function PixelCard({
  pairedDie,
  vertical,
  selected,
  selectable,
  contentStyle,
  ...props
}: {
  pairedDie: PairedDie;
  vertical?: boolean;
  selected?: boolean;
  selectable?: boolean;
} & Omit<TouchableCardProps, "children" | "row">) {
  const pixel = useWatchedPixel(pairedDie);
  const status = usePixelStatus(pixel);
  const flash = useIsPixelRolling(pixel, status);
  return (
    <TouchableCard
      row
      gradientBorder={status === "ready" ? "bright" : "dark"}
      flash={flash}
      selected={selected}
      selectable={selectable}
      // contentStyle={{ aspectRatio: 1 }} Creates problems with the layout for vertical cards
      contentStyle={vertical ? undefined : [{ padding: 5 }, contentStyle]}
      {...props}
    >
      {vertical ? (
        <PixelVCardContent
          pairedDie={pairedDie}
          pixel={pixel}
          status={status}
          selectable={selectable}
          contentStyle={contentStyle}
        />
      ) : (
        <PixelHCardContent
          pairedDie={pairedDie}
          pixel={pixel}
          status={status}
        />
      )}
    </TouchableCard>
  );
}

export function EmptyDiceBagCard({ onPress }: { onPress: () => void }) {
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness);
  return (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      colors={[colors.primary, colors.tertiary]}
      style={{
        overflow: "hidden",
        width: "80%",
        marginTop: 20,
        alignSelf: "center",
        borderRadius,
      }}
    >
      <View
        style={{
          gap: 40,
          margin: 2,
          paddingVertical: 40,
          paddingHorizontal: 20,
          alignItems: "center",
          justifyContent: "center",
          borderRadius,
          backgroundColor: colors.background,
        }}
      >
        <Text variant="titleLarge">Welcome!</Text>
        <Text variant="bodyMedium" style={{ alignSelf: "stretch" }}>
          In order to customize your Pixels dice you need to pair them with the
          app.
        </Text>
        <Text variant="bodyMedium" style={{ alignSelf: "stretch" }}>
          Tap on the "Add Die" button to get started.
        </Text>
        <GradientButton onPress={onPress}>Add Die</GradientButton>
      </View>
    </LinearGradient>
  );
}

export function EmptyLibraryCard({ onPress }: { onPress: () => void }) {
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness);
  return (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      colors={[colors.primary, colors.tertiary]}
      style={{
        overflow: "hidden",
        width: "80%",
        marginTop: 60,
        alignSelf: "center",
        borderRadius,
      }}
    >
      <View
        style={{
          gap: 40,
          margin: 2,
          paddingVertical: 40,
          paddingHorizontal: 20,
          alignItems: "center",
          justifyContent: "center",
          borderRadius,
          backgroundColor: colors.background,
        }}
      >
        <Text variant="titleLarge">The Profiles library</Text>
        <Text variant="bodyMedium" style={{ alignSelf: "stretch" }}>
          A Profile stores all the data required to animate the LEDs of a Pixels
          die and trigger actions on rolls.
        </Text>
        <Text variant="bodyMedium" style={{ alignSelf: "stretch" }}>
          Save any of your dice Profile that your like to the library or create
          new ones from scratch.
        </Text>
        <GradientButton onPress={onPress}>Create Profile</GradientButton>
      </View>
    </LinearGradient>
  );
}
