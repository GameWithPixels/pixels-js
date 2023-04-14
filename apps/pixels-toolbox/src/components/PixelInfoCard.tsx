import {
  FastBox,
  FastHStack,
} from "@systemic-games/react-native-base-components";
import { PixelInfoNotifier } from "@systemic-games/react-native-pixels-connect";
import { Text, VStack } from "native-base";
import React from "react";
import { TFunction, useTranslation } from "react-i18next";

import useForceUpdate from "~/features/hooks/useForceUpdate";
import toLocaleDateTimeString from "~/utils/toLocaleDateTimeString";

interface PixelAndTranslation {
  pixelInfo: PixelInfoNotifier;
  t: TFunction;
}

function PixelName({ pixelInfo: pixel }: Omit<PixelAndTranslation, "t">) {
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
      <Text variant="h2">{pixel.name}</Text>
    </FastBox>
  );
}

function PixelRssi({ pixelInfo: pixel, t }: PixelAndTranslation) {
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

function PixelBattery({ pixelInfo: pixel, t }: PixelAndTranslation) {
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

function PixelRollState({ pixelInfo: pixel, t }: PixelAndTranslation) {
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
      <Text italic>{`(${t(pixel.rollState)})`}</Text>
    </Text>
  );
}

function PixelFirmwareDate({ pixelInfo: pixel, t }: PixelAndTranslation) {
  const forceUpdate = useForceUpdate();
  React.useEffect(() => {
    const listener = () => forceUpdate();
    pixel.addPropertyListener("firmwareDate", listener);
    return () => {
      pixel.removePropertyListener("firmwareDate", listener);
    };
  }, [pixel, forceUpdate]);
  return (
    <Text>
      {t("firmware")}
      {t("colonSeparator")}
      {toLocaleDateTimeString(pixel.firmwareDate)}
    </Text>
  );
}

function PixelMoreInfo(props: PixelAndTranslation) {
  const { pixelInfo: pixel, t } = props;
  const pixIdHex = pixel.pixelId
    .toString(16)
    .padStart(8, "0")
    .toLocaleUpperCase();
  return (
    <>
      <PixelFirmwareDate {...props} />
      <FastHStack w="100%" justifyContent="space-around">
        <Text>{`🆔 ${pixIdHex}`}</Text>
        <Text>{`${t(pixel.designAndColor)}`}</Text>
        <Text>{`${pixel.ledCount}🚦`}</Text>
      </FastHStack>
    </>
  );
}

export interface PixelInfoCardProps extends React.PropsWithChildren {
  pixelInfo: PixelInfoNotifier;
  moreInfo?: boolean;
}

export default function PixelInfoCard({
  children,
  pixelInfo,
  moreInfo,
}: PixelInfoCardProps) {
  const { t } = useTranslation();
  const props = { pixelInfo, t };
  return (
    <VStack
      variant="cardWithBorder"
      alignItems="center"
      px={3}
      py={1}
      space={1}
    >
      <PixelName pixelInfo={pixelInfo} />
      {moreInfo && <PixelMoreInfo {...props} />}
      <FastHStack w="100%" justifyContent="space-around">
        <PixelRssi {...props} />
        <PixelBattery {...props} />
        <PixelRollState {...props} />
      </FastHStack>
      {children}
    </VStack>
  );
}
