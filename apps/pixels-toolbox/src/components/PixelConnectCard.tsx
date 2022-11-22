import {
  Color,
  getPixel,
  ScannedPixel,
} from "@systemic-games/react-native-pixels-connect";
import { Center, Text } from "native-base";

import EmojiButton from "./EmojiButton";
import PixelInfoCard, { PixelInfoCardProps } from "./PixelInfoCard";
import ProgressBar from "./ProgressBar";

import { useAppSelector } from "~/app/hooks";
import getDfuFileInfo from "~/features/dfu/getDfuFileInfo";
import useUpdateFirmware from "~/features/dfu/useUpdateFirmware";
import usePixelConnect from "~/features/pixels/hooks/usePixelConnect";
import { sr } from "~/styles";

export interface PixelConnectCardProps
  extends Omit<PixelInfoCardProps, "pixel"> {
  scannedPixel: ScannedPixel;
}

export default function ({
  children,
  scannedPixel,
  ...props
}: PixelConnectCardProps) {
  const { dfuFiles } = useAppSelector((state) => state.dfuFiles);
  const [status, pixel, connectorDispatch, error] = usePixelConnect();
  const [updateFirmware, dfuState, dfuProgress] = useUpdateFirmware();
  const isDisco = !status || status === "disconnected";
  return (
    <PixelInfoCard pixel={scannedPixel} {...props}>
      <Center mb={sr(5)} width="100%">
        <Center flexDir="row">
          {status && (
            <Text>
              <Text>Status: </Text>
              <Text italic>{status}</Text>
            </Text>
          )}
          <EmojiButton
            ml="5%"
            onPress={() => {
              // TODO should be able to disconnect in any state
              if (status === "ready") {
                connectorDispatch("disconnect", pixel);
              } else if (isDisco) {
                connectorDispatch("connect", getPixel(scannedPixel));
              }
            }}
          >
            {isDisco ? "▶️" : "❌"}
          </EmojiButton>
          {status === "ready" && (
            <EmojiButton ml="5%" onPress={() => pixel?.blink(Color.dimOrange)}>
              💡
            </EmojiButton>
          )}
          {dfuFiles.length > 0 &&
            // TODO compare rounded value
            (getDfuFileInfo(dfuFiles[0]).date?.getTime() ?? 0) <
              scannedPixel.firmwareDate.getTime() && (
              <EmojiButton
                ml="5%"
                onPress={() => {
                  const filesInfo = dfuFiles.map(getDfuFileInfo);
                  const bootloader = filesInfo.filter(
                    (i) => i.type === "bootloader"
                  )[0];
                  const firmware = filesInfo.filter(
                    (i) => i.type === "firmware"
                  )[0];
                  updateFirmware(
                    scannedPixel.address,
                    bootloader?.pathname,
                    firmware?.pathname
                  );
                }}
              >
                ⬆️
              </EmojiButton>
            )}
        </Center>
        {dfuState && (
          <Center my={sr(5)} width="100%">
            <Text variant="comment">{`DFU State: ${dfuState}`}</Text>
            <Center mt={sr(5)} width="90%">
              <ProgressBar percent={dfuProgress ?? 0} />
            </Center>
          </Center>
        )}
        {children}
        {error && (
          <Text bold color="red.500">
            {error?.message}
          </Text>
        )}
      </Center>
    </PixelInfoCard>
  );
}
