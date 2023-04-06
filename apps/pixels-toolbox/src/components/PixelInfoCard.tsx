import {
  FastBox,
  FastHStack,
} from "@systemic-games/react-native-base-components";
import { PixelInfo } from "@systemic-games/react-native-pixels-connect";
import { Text, VStack } from "native-base";
import { memo, PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

import toLocaleDateTimeString from "~/utils/toLocaleDateTimeString";

export interface PixelInfoCardProps extends PropsWithChildren {
  pixel: PixelInfo;
  moreInfo?: boolean;
}

function PixelMoreInfo({ pixel }: { pixel: PixelInfo }) {
  const { t } = useTranslation();
  const pixIdHex = pixel.pixelId
    .toString(16)
    .padStart(8, "0")
    .toLocaleUpperCase();
  const fwDate = toLocaleDateTimeString(pixel.firmwareDate);
  return (
    <>
      <Text>
        {t("firmware")}
        {t("colonSeparator")}
        {fwDate}
      </Text>
      <FastHStack w="100%" justifyContent="space-around">
        <Text>{`🆔 ${pixIdHex}`}</Text>
        <Text>{`${t(pixel.designAndColor)}`}</Text>
        <Text>{`${pixel.ledCount}🚦`}</Text>
      </FastHStack>
    </>
  );
}

function PixelInfoCardImpl({ children, pixel, moreInfo }: PixelInfoCardProps) {
  const { t } = useTranslation();
  const charging = pixel.isCharging ? "⚡️" : "🔋";
  return (
    <VStack
      variant="cardWithBorder"
      alignItems="center"
      px={3}
      py={1}
      space={1}
    >
      <FastBox flexDir="row" justifyContent="center">
        <Text variant="h2">{pixel.name}</Text>
      </FastBox>
      {moreInfo && <PixelMoreInfo pixel={pixel} />}
      <FastHStack w="100%" justifyContent="space-around">
        <Text>{`📶 ${t("dBWithValue", { value: pixel.rssi })}`}</Text>
        <Text>{`${charging} ${t("percentWithValue", {
          value: pixel.batteryLevel,
        })}`}</Text>
        <Text>
          <Text>{`🎲 ${pixel.currentFace} `}</Text>
          <Text italic>{`(${t(pixel.rollState)})`}</Text>
        </Text>
      </FastHStack>
      {children}
    </VStack>
  );
}

function _arePropsEqual(
  props1: Readonly<PixelInfoCardProps>,
  props2: Readonly<PixelInfoCardProps>
) {
  return (
    props1.children === props2.children &&
    props1.moreInfo === props2.moreInfo &&
    props1.pixel.name === props2.pixel.name &&
    props1.pixel.rssi === props2.pixel.rssi &&
    props1.pixel.isCharging === props2.pixel.isCharging &&
    props1.pixel.batteryLevel === props2.pixel.batteryLevel &&
    props1.pixel.currentFace === props2.pixel.currentFace &&
    props1.pixel.rollState === props2.pixel.rollState &&
    (!props1.moreInfo ||
      (props1.pixel.pixelId === props2.pixel.pixelId &&
        props1.pixel.firmwareDate === props2.pixel.firmwareDate &&
        props1.pixel.designAndColor === props2.pixel.designAndColor &&
        props1.pixel.ledCount === props2.pixel.ledCount))
  );
}

export default memo(PixelInfoCardImpl, _arePropsEqual);
