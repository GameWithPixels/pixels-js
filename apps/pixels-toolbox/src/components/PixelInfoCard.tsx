import { assertNever } from "@systemic-games/pixels-core-utils";
import {
  BaseBox,
  BaseHStack,
} from "@systemic-games/react-native-base-components";
import {
  PixelColorway,
  PixelInfoNotifier,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { TFunction, useTranslation } from "react-i18next";
import { View } from "react-native";
import { Card, Text } from "react-native-paper";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { AppStyles } from "~/AppStyles";
import { useForceUpdate } from "~/features/hooks/useForceUpdate";
import { toLocaleDateTimeString } from "~/features/toLocaleDateTimeString";

function getColorwayInitials(colorway: PixelColorway): string | undefined {
  switch (colorway) {
    case "onyxBlack":
      return "OB";
    case "hematiteGrey":
      return "HG";
    case "midnightGalaxy":
      return "MG";
    case "auroraSky":
      return "AS";
    case "clear":
      return "CL";
    case "custom":
      return "CS";
    case "unknown":
      return undefined;
    default:
      assertNever(colorway);
  }
}

interface PixelAndTranslation {
  pixel: PixelInfoNotifier;
  t: TFunction;
}

function PixelName({ pixel }: Omit<PixelAndTranslation, "t">) {
  const [initials, setInitials] = React.useState(
    getColorwayInitials(pixel.colorway)
  );
  const forceUpdate = useForceUpdate();
  React.useEffect(() => {
    const listener = () => forceUpdate();
    pixel.addPropertyListener("name", listener);
    const onColorwayChange = () =>
      setInitials(getColorwayInitials(pixel.colorway));
    pixel.addPropertyListener("colorway", onColorwayChange);
    return () => {
      pixel.removePropertyListener("name", listener);
      pixel.removePropertyListener("colorway", onColorwayChange);
    };
  }, [pixel, forceUpdate]);
  return (
    <BaseBox flexDir="row" alignItems="center" justifyContent="center" gap={20}>
      <Text variant="headlineMedium">{pixel.name}</Text>
      {initials && (
        <Text style={{ position: "absolute", right: 0 }} variant="titleSmall">
          ({initials})
        </Text>
      )}
    </BaseBox>
  );
}

function PixelRssi({ pixel, t }: PixelAndTranslation) {
  const forceUpdate = useForceUpdate();
  React.useEffect(() => {
    const listener = () => forceUpdate();
    pixel.addPropertyListener("rssi", listener);
    return () => {
      pixel.removePropertyListener("rssi", listener);
    };
  }, [pixel, forceUpdate]);
  return <Text>{`📶 ${t("dBmWithValue", { value: pixel.rssi })}`}</Text>;
}

function PixelBattery({ pixel, t }: PixelAndTranslation) {
  const forceUpdate = useForceUpdate();
  React.useEffect(() => {
    const listener = () => forceUpdate();
    pixel.addPropertyListener("batteryLevel", listener);
    pixel.addPropertyListener("isCharging", listener);
    return () => {
      pixel.removePropertyListener("batteryLevel", listener);
      pixel.removePropertyListener("isCharging", listener);
    };
  }, [pixel, forceUpdate]);
  const charging = pixel.isCharging ? "⚡️" : "🔋";
  return (
    <Text>
      {`${charging} ${t("percentWithValue", {
        value: pixel.batteryLevel,
      })}`}
    </Text>
  );
}

function PixelRollState({ pixel, t }: PixelAndTranslation) {
  const forceUpdate = useForceUpdate();
  React.useEffect(() => {
    const listener = () => forceUpdate();
    pixel.addPropertyListener("rollState", listener);
    pixel.addPropertyListener("currentFace", listener);
    return () => {
      pixel.removePropertyListener("rollState", listener);
      pixel.removePropertyListener("currentFace", listener);
    };
  }, [pixel, forceUpdate]);
  return (
    <Text>
      <Text>{`${t(pixel.dieType)} 🎲 ${pixel.currentFace} `}</Text>
      <Text style={AppStyles.italic}>{`(${t(pixel.rollState)})`}</Text>
    </Text>
  );
}

function PixelFirmwareDate({ pixel, t }: PixelAndTranslation) {
  const forceUpdate = useForceUpdate();
  React.useEffect(() => {
    const listener = () => forceUpdate();
    pixel.addPropertyListener("firmwareDate", listener);
    return () => {
      pixel.removePropertyListener("firmwareDate", listener);
    };
  }, [pixel, forceUpdate]);
  return (
    <Text style={AppStyles.textCentered}>
      {t("firmware")}
      {t("colonSeparator")}
      {toLocaleDateTimeString(pixel.firmwareDate)}
    </Text>
  );
}

function PixelMoreInfo(props: PixelAndTranslation) {
  const { pixel, t } = props;
  const pixIdHex = pixel.pixelId.toString(16).padStart(8, "0");
  const forceUpdate = useForceUpdate();
  React.useEffect(() => {
    const listener = () => forceUpdate();
    pixel.addPropertyListener("colorway", listener);
    return () => {
      pixel.removePropertyListener("colorway", listener);
    };
  }, [pixel, forceUpdate]);
  return (
    <>
      <PixelFirmwareDate {...props} />
      <BaseHStack mt={5} w="100%" justifyContent="space-around">
        <Text>{`🆔 ${pixIdHex}`}</Text>
        <Text>{`${pixel.ledCount}🚦`}</Text>
        <Text>{pixel.colorway !== "unknown" ? t(pixel.colorway) : ""}</Text>
      </BaseHStack>
    </>
  );
}

function BlinkingCard({
  children,
  pixel,
}: React.PropsWithChildren<Pick<PixelAndTranslation, "pixel">>) {
  const isLoopingRef = React.useRef(false);
  const animValue = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      animValue.value,
      [0, 1],
      ["transparent", "dimgray"]
    ),
  }));
  React.useEffect(() => {
    const flash = (x0: number, x1: number) =>
      withSequence(
        withTiming(x0, {
          duration: 600,
          easing: Easing.out(Easing.ease),
        }),
        withTiming(x1, { duration: 300, easing: Easing.in(Easing.ease) })
      );
    const listener = () => {
      if (pixel.rollState === "rolling" || pixel.rollState === "handling") {
        if (!isLoopingRef.current) {
          isLoopingRef.current = true;
          animValue.value = withRepeat(flash(0.5, 0), -1);
        }
      } else {
        isLoopingRef.current = false;
        animValue.value = flash(1, 0);
      }
    };
    pixel.addPropertyListener("rollState", listener);
    return () => {
      pixel.removePropertyListener("rollState", listener);
    };
  }, [animValue, pixel]);

  return (
    <Card style={{ overflow: "hidden" }}>
      <Animated.View
        style={[
          {
            gap: 5,
            paddingVertical: 8,
            paddingHorizontal: 16,
          },
          animStyle,
        ]}
      >
        {children}
      </Animated.View>
    </Card>
  );
}

export const PixelInfoCardModeContext = React.createContext<
  "normal" | "expanded"
>("normal");

export interface PixelInfoCardProps extends React.PropsWithChildren {
  pixelInfo: PixelInfoNotifier;
}

export function PixelInfoCard({ children, pixelInfo }: PixelInfoCardProps) {
  const { t } = useTranslation();
  const props = { pixel: pixelInfo, t };
  return (
    <BlinkingCard pixel={pixelInfo}>
      <PixelName pixel={pixelInfo} />
      <PixelInfoCardModeContext.Consumer>
        {(mode) => (
          <View style={{ height: mode === "expanded" ? undefined : 0 }}>
            <PixelMoreInfo {...props} />
          </View>
        )}
      </PixelInfoCardModeContext.Consumer>
      <BaseHStack w="100%" justifyContent="space-around">
        <PixelRssi {...props} />
        <PixelBattery {...props} />
        <PixelRollState {...props} />
      </BaseHStack>
      {children}
    </BlinkingCard>
  );
}
