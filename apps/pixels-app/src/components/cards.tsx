import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useForceUpdate, usePixelStatus } from "@systemic-games/pixels-react";
import {
  Pixel,
  PixelEventMap,
  PixelRollState,
  PixelStatus,
} from "@systemic-games/react-native-pixels-connect";
import { observer } from "mobx-react-lite";
import React from "react";
import { View, ViewProps } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { DebugPixelID } from "./DebugPixelID";
import { FirmwareUpdateBadge } from "./FirmwareUpdateBadge";
import { PairedDieRendererWithRoll } from "./PairedDieRendererWithRoll";
import { PixelBattery } from "./PixelBattery";
import { PixelConnectionStatus } from "./PixelConnectionStatus";
import { PixelRssi } from "./PixelRssi";
import { PixelTransferProgressBar } from "./PixelTransferProgressBar";
import { TouchableCardProps, TouchableCard } from "./TouchableCard";
import { DieWireframe } from "./icons";

import { PairedDie } from "~/app/PairedDie";
import { getRollStateAndFaceLabel } from "~/features/profiles";
import {
  useIsModifiedDieProfile,
  useIsPixelRolling,
  useProfile,
  useRegisteredPixel,
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
  const modifiedProfile = useIsModifiedDieProfile(
    pairedDie.profileUuid,
    pairedDie.dieType
  );

  // Ignore crooked and onFace roll states
  const [rollState, setRollState] = React.useState<{
    state: PixelRollState;
    face: number;
  }>();
  const previousRollState = React.useRef<PixelRollState>();
  const clearTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>();
  const forceUpdate = useForceUpdate();
  React.useEffect(() => {
    if (pixel) {
      const rollListener = ({ state, face }: PixelEventMap["rollState"]) => {
        if (state === "handling" || state === "rolling" || state === "rolled") {
          clearTimeout(clearTimeoutRef.current);
          setRollState({ state, face });
          if (state === "rolled") {
            clearTimeoutRef.current = setTimeout(
              () => setRollState(undefined),
              3000
            );
          }
        } else if (
          state === "crooked" ||
          previousRollState.current !== "rolled"
        ) {
          setRollState(undefined);
        }
        previousRollState.current = state;
        // Re-render on each roll state change
        if (!compact) {
          forceUpdate();
        }
      };
      pixel.addEventListener("rollState", rollListener);
      const statusListener = ({ status }: PixelEventMap["statusChanged"]) => {
        status !== "ready" && setRollState(undefined);
        // Re-render on each status change
        forceUpdate();
      };
      pixel.addEventListener("statusChanged", statusListener);
      return () => {
        pixel.removeEventListener("rollState", rollListener);
        pixel.removeEventListener("statusChanged", statusListener);
        previousRollState.current = undefined;
        clearTimeout(clearTimeoutRef.current);
        clearTimeoutRef.current = undefined;
      };
    }
  }, [compact, forceUpdate, pixel]);

  // Animate roll results
  const animValue = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animValue.value }],
  }));
  React.useEffect(() => {
    if (rollState?.state === "rolled") {
      animValue.value = withSequence(
        withTiming(1.2, {
          duration: 400,
          easing: Easing.out(Easing.ease),
        }),
        withTiming(1, { duration: 200, easing: Easing.in(Easing.ease) })
      );
      return () => {
        animValue.value = 1;
      };
    }
  }, [animValue, rollState?.state]);

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
            {!compact
              ? (getRollStateAndFaceLabel(
                  pixel?.rollState,
                  pixel?.currentFace
                ) ?? "")
              : rollState
                ? getRollStateAndFaceLabel(rollState.state, rollState.face)
                : profile.name}
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
      <DebugPixelID pixelId={pairedDie.pixelId} />
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
  const pixel = useRegisteredPixel(pairedDie);
  const status = usePixelStatus(pixel);
  const flash = useIsPixelRolling(pixel, status);
  return (
    <TouchableCard
      row
      gradientBorder={status === "ready" ? "bright" : "dark"}
      rotatingBorder={status === "connecting"}
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
