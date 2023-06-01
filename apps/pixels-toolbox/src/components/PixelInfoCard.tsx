import {
  FastBox,
  FastHStack,
} from "@systemic-games/react-native-base-components";
import { PixelInfoNotifier } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { TFunction, useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Card, Text } from "react-native-paper";

import useForceUpdate from "~/features/hooks/useForceUpdate";
import gs from "~/styles";
import toLocaleDateTimeString from "~/features/toLocaleDateTimeString";

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
    <FastBox flexDir="row" justifyContent="center">
      <Text variant="headlineMedium">{pixel.name}</Text>
    </FastBox>
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
  return <Text>{`📶 ${t("dBWithValue", { value: pixel.rssi })}`}</Text>;
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
      <Text>{`🎲 ${pixel.currentFace} `}</Text>
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
    <Text style={styles.textCentered}>
      {t("firmware")}
      {t("colonSeparator")}
      {toLocaleDateTimeString(pixel.firmwareDate)}
    </Text>
  );
}

function PixelMoreInfo(props: PixelAndTranslation) {
  const { pixel } = props;
  const pixIdHex = pixel.pixelId
    .toString(16)
    .padStart(8, "0")
    .toLocaleUpperCase();
  return (
    <>
      <PixelFirmwareDate {...props} />
      <FastHStack mt={5} w="100%" justifyContent="space-around">
        <Text>{`🆔 ${pixIdHex}`}</Text>
        <Text>{`${pixel.designAndColor}`}</Text>
        <Text>{`${pixel.ledCount}🚦`}</Text>
      </FastHStack>
    </>
  );
}

export const PixelInfoCardModeContext = React.createContext<
  "normal" | "expanded"
>("normal");

export interface PixelInfoCardProps extends React.PropsWithChildren {
  pixelInfo: PixelInfoNotifier;
}

export default function PixelInfoCard({
  children,
  pixelInfo,
}: PixelInfoCardProps) {
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
        <FastHStack w="100%" justifyContent="space-around">
          <PixelRssi {...props} />
          <PixelBattery {...props} />
          <PixelRollState {...props} />
        </FastHStack>
        {children}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  textCentered: {
    textAlign: "center",
  },
});
