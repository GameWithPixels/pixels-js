import {
  BaseBox,
  BaseHStack,
} from "@systemic-games/react-native-base-components";
import { PixelInfoNotifier } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { TFunction, useTranslation } from "react-i18next";
import { View } from "react-native";
import { Card, Text } from "react-native-paper";

import { useForceUpdate } from "~/features/hooks/useForceUpdate";
import { toLocaleDateTimeString } from "~/features/toLocaleDateTimeString";
import gs from "~/styles";

interface PixelAndTranslation {
  pixel: PixelInfoNotifier;
  t: TFunction;
}

function PixelName({ pixel }: Omit<PixelAndTranslation, "t">) {
  const forceUpdate = useForceUpdate();
  React.useEffect(() => {
    const listener = () => forceUpdate();
    pixel.addPropertyListener("name", listener);
    return () => {
      pixel.removePropertyListener("name", listener);
    };
  }, [pixel, forceUpdate]);
  return (
    <BaseBox flexDir="row" justifyContent="center">
      <Text variant="headlineMedium">{pixel.name}</Text>
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
      <Text style={gs.italic}>{`(${t(pixel.rollState)})`}</Text>
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
    <Text style={gs.textCentered}>
      {t("firmware")}
      {t("colonSeparator")}
      {toLocaleDateTimeString(pixel.firmwareDate)}
    </Text>
  );
}

function PixelMoreInfo(props: PixelAndTranslation) {
  const { pixel, t } = props;
  const pixIdHex = pixel.pixelId
    .toString(16)
    .padStart(8, "0")
    .toLocaleUpperCase();
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
    <Card>
      <Card.Content style={{ gap: 5 }}>
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
      </Card.Content>
    </Card>
  );
}
