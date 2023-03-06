import {
  ScannedPixel,
  getPixel,
  usePixelConnect,
  usePixelValue,
} from "@systemic-games/react-native-pixels-connect";
import { Center, Pressable, Text } from "native-base";
import { useCallback } from "react";

import AppPage from "~/components/AppPage";
import PixelScanList from "~/components/PixelScanList";
import useErrorWithHandler from "~/features/hooks/useErrorWithHandler";
import { sr } from "~/styles";

function RollPage() {
  const [status, pixel, connectDispatch, lastError] = usePixelConnect();
  const [rollState] = usePixelValue(pixel, "rollState");
  useErrorWithHandler(lastError);

  const onSelect = useCallback(
    (sp: ScannedPixel) => connectDispatch("connect", getPixel(sp)),
    [connectDispatch]
  );

  const isConnecting = status === "connecting" || status === "identifying";
  const backgroundColor =
    !status || isConnecting
      ? "yellow"
      : status !== "ready"
      ? "red"
      : rollState?.state !== "onFace"
      ? "blue"
      : "green";
  return (
    <>
      {!pixel ? (
        <PixelScanList onSelect={onSelect} />
      ) : (
        <Pressable onPress={() => connectDispatch("disconnect")}>
          <Center
            width="100%"
            height="100%"
            backgroundColor={`${backgroundColor}.600`}
          >
            {isConnecting ? (
              <Text fontSize={sr(250)} bold color="white">
                ...
              </Text>
            ) : (
              status === "ready" &&
              rollState &&
              rollState.state !== "unknown" && (
                <Text fontSize={sr(250)} bold color="white">
                  {rollState.face}
                </Text>
              )
            )}
          </Center>
        </Pressable>
      )}
    </>
  );
}

export default function () {
  return (
    <AppPage>
      <RollPage />
    </AppPage>
  );
}
