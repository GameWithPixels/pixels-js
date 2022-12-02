import { IPixel } from "@systemic-games/react-native-pixels-connect";
import { Center, HStack, Text, VStack } from "native-base";
import { memo, PropsWithChildren } from "react";

import { sr } from "~/styles";
import toLocaleDateTimeString from "~/utils/toLocaleDateTimeString";

export interface PixelInfoCardProps extends PropsWithChildren {
  pixel: IPixel;
  moreInfo?: boolean;
}

function PixelMoreInfo({ pixel }: { pixel: IPixel }) {
  const pixIdHex = pixel.pixelId
    .toString(16)
    .padStart(8, "0")
    .toLocaleUpperCase();
  const fwDate = toLocaleDateTimeString(pixel.firmwareDate);
  return (
    <>
      <Text>{`Firmware: ${fwDate}`}</Text>
      <HStack space="8%">
        <Text>{`🆔 ${pixIdHex}`}</Text>
        <Text>{`${pixel.designAndColor}`}</Text>
        <Text>{`${pixel.ledCount}🚦`}</Text>
      </HStack>
    </>
  );
}

function PixelInfoCardImpl({ children, pixel, moreInfo }: PixelInfoCardProps) {
  const charging = pixel.isCharging ? "⚡️" : "🔋";
  return (
    <VStack
      variant="cardWithBorder"
      alignItems="center"
      px={sr(5)}
      py={sr(3)}
      space={sr(3)}
      w="100%"
    >
      <Center flexDir="row">
        <Text variant="h2">{pixel.name}</Text>
      </Center>
      {moreInfo && <PixelMoreInfo pixel={pixel} />}
      <HStack space="8%">
        <Text>{`📶 ${pixel.rssi}dB`}</Text>
        <Text>{`${charging} ${pixel.batteryLevel}%`}</Text>
        <Text>
          <Text>{`🎲 ${pixel.currentFace} `}</Text>
          <Text italic>{`(${pixel.rollState})`}</Text>
        </Text>
      </HStack>
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
