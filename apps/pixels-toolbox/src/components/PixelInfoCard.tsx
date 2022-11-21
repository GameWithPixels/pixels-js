import { IPixel } from "@systemic-games/react-native-pixels-connect";
import { Center, Text } from "native-base";
import { PropsWithChildren } from "react";

import { sr } from "~/styles";
import toLocaleDateTimeString from "~/utils/toLocaleDateTimeString";

export interface PixelInfoCardProps extends PropsWithChildren {
  pixel: IPixel;
  showInfo?: boolean;
}

export default function ({ children, pixel, showInfo }: PixelInfoCardProps) {
  const pixIdHex = pixel.pixelId
    .toString(16)
    .padStart(8, "0")
    .toLocaleUpperCase();
  const fwDate = toLocaleDateTimeString(pixel.firmwareDate);
  const charging = pixel.isCharging ? "⚡️" : "🔋";
  return (
    <Center variant="cardWithBorder" px="3%" py="1%" w="100%">
      <Center flexDir="row">
        <Text variant="h2">{pixel.name}</Text>
      </Center>
      {showInfo && (
        <>
          <Center flexDir="row" mb={sr(5)}>
            <Text mr="5%">{`🆔 ${pixIdHex}`}</Text>
            <Text mr="5%">{`${pixel.designAndColor}`}</Text>
            <Text>{`${pixel.ledCount}💡`}</Text>
          </Center>
          <Text mb={sr(5)}>{`Firmware: ${fwDate}`}</Text>
        </>
      )}
      <Center flexDir="row" mb={sr(5)}>
        <Text mr="5%">{`📶 ${pixel.rssi}dB`}</Text>
        <Text mr="5%">{`${charging} ${pixel.batteryLevel}%`}</Text>
        <Text>
          <Text>{`🎲 ${pixel.currentFace} `}</Text>
          <Text italic>{`(${pixel.rollState})`}</Text>
        </Text>
      </Center>
      {children}
    </Center>
  );
}
