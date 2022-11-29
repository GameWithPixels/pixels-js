import { IPixel } from "@systemic-games/react-native-pixels-connect";
import { Center, HStack, Text, VStack } from "native-base";
import { PropsWithChildren } from "react";

import { sr } from "~/styles";
import toLocaleDateTimeString from "~/utils/toLocaleDateTimeString";

export interface PixelInfoCardProps extends PropsWithChildren {
  pixel: IPixel;
  moreInfo?: boolean;
}

export default function ({ children, pixel, moreInfo }: PixelInfoCardProps) {
  const pixIdHex = pixel.pixelId
    .toString(16)
    .padStart(8, "0")
    .toLocaleUpperCase();
  const fwDate = toLocaleDateTimeString(pixel.firmwareDate);
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
      {moreInfo && (
        <>
          <Text>{`Firmware: ${fwDate}`}</Text>
          <HStack space="8%">
            <Text>{`🆔 ${pixIdHex}`}</Text>
            <Text>{`${pixel.designAndColor}`}</Text>
            <Text>{`${pixel.ledCount}🚦`}</Text>
          </HStack>
        </>
      )}
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
