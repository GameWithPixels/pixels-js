import {
  ScannedPixel,
  getPixel,
  usePixelConnect,
  usePixelValue,
} from "@systemic-games/react-native-pixels-connect";
import { Center, Pressable, Text } from "native-base";
import { useCallback } from "react";

import AppPage from "~/components/AppPage";
import ScannedPixelsList from "~/components/ScannedPixelsList";
import useErrorWithHandler from "~/features/hooks/useErrorWithHandler";

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
        <ScannedPixelsList onSelect={onSelect} />
      ) : (
        <Pressable onPress={() => connectDispatch("disconnect")}>
          <Center
            width="100%"
            height="100%"
            backgroundColor={`${backgroundColor}.600`}
          >
            {isConnecting ? (
              <Text fontSize={250} bold color="white">
                ...
              </Text>
            ) : (
              status === "ready" &&
              rollState &&
              rollState.state !== "unknown" && (
                <Text fontSize={250} bold color="white">
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
