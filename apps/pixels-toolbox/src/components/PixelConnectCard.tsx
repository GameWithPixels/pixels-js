import {
  getPixel,
  ScannedPixel,
} from "@systemic-games/react-native-pixels-connect";
import { Center, Text } from "native-base";

import EmojiButton from "./EmojiButton";
import PixelInfoCard, { PixelInfoCardProps } from "./PixelInfoCard";

import usePixelConnect from "~/features/pixels/hooks/usePixelConnect";
import { sr } from "~/styles";

export interface PixelConnectCardProps extends PixelInfoCardProps {
  pixel: ScannedPixel;
}

export default function ({ children, pixel, showInfo }: PixelConnectCardProps) {
  const [status, connectorDispatch, error] = usePixelConnect();
  const isDisco = !status || status === "disconnected";
  return (
    <PixelInfoCard pixel={pixel} showInfo={showInfo}>
      <Center flexDir="row" mb={sr(5)}>
        <Text>
          <Text>Status: </Text>
          <Text italic>{status ?? "unknown"}</Text>
        </Text>
        <EmojiButton
          ml="5%"
          onPress={() =>
            connectorDispatch(
              isDisco ? "connect" : "disconnect",
              getPixel(pixel)
            )
          }
        >
          {isDisco ? "▶️" : "❌"}
        </EmojiButton>
        <EmojiButton ml="5%" onPress={() => {}}>
          💡
        </EmojiButton>
        <EmojiButton ml="5%" onPress={() => {}}>
          ⬆️
        </EmojiButton>
        {error && (
          <Text bold color="red.500">
            {error?.message}
          </Text>
        )}
        {children}
      </Center>
    </PixelInfoCard>
  );
}
