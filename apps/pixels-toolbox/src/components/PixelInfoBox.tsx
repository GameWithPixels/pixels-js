import { IPixel } from "@systemic-games/react-native-pixels-connect";
import { Center, Text } from "native-base";
import { PropsWithChildren } from "react";

import EmojiButton from "./EmojiButton";

import toLocaleDateTimeString from "~/utils/toLocaleDateTimeString";

export interface PixelInfoBoxProps extends PropsWithChildren {
  pixel: IPixel;
  showInfo?: boolean;
  onConnectPressed?: (pixel: IPixel) => void;
  onDfuPressed?: (pixel: IPixel) => void;
}

export default function ({
  children,
  pixel,
  showInfo,
  onConnectPressed,
  onDfuPressed,
}: PixelInfoBoxProps) {
  const pixIdHex = pixel.pixelId
    .toString(16)
    .padStart(8, "0")
    .toLocaleUpperCase();
  const fwDate = toLocaleDateTimeString(new Date(pixel.buildTimestamp * 1000));
  return (
    <Center variant="cardWithBorder" px="3%" py="1%" w="100%">
      <Center flexDirection="row">
        {onConnectPressed && (
          <EmojiButton mr="3%" onPress={() => onConnectPressed(pixel)}>
            ▶️
          </EmojiButton>
        )}
        <Text variant="h2">{`Name: ${pixel.name}`}</Text>
        {onDfuPressed && (
          <EmojiButton ml="3%" onPress={() => onDfuPressed(pixel)}>
            ⬆️
          </EmojiButton>
        )}
      </Center>
      {showInfo && (
        <>
          <Center flexDirection="row">
            <Text mr="5%">{`🆔 ${pixIdHex}`}</Text>
            <Text mr="5%">{`${pixel.designAndColor}`}</Text>
            <Text>{`${pixel.ledCount}💡`}</Text>
          </Center>
          <Text>{`⚙️ ${fwDate}`}</Text>
        </>
      )}
      <Center flexDirection="row">
        <Text mr="5%">{`📶 ${pixel.rssi}dB`}</Text>
        <Text mr="5%">{`⚡️ ${pixel.batteryLevel}%`}</Text>
        <Text>{`🎲 ${pixel.currentFace} (${pixel.rollState})`}</Text>
      </Center>
      {children}
    </Center>
  );
}
