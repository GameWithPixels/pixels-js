import { usePixelConnect, usePixelValue } from "@systemic-games/pixels-react";
import { getPixel } from "@systemic-games/react-native-pixels-connect";
import { Center, Pressable, Text } from "native-base";
import { useEffect } from "react";
import { useErrorHandler } from "react-error-boundary";

import AppPage from "~/components/AppPage";
import PixelScanList from "~/components/PixelScanList";
import { sr } from "~/styles";

function RollPage() {
  const errorHandler = useErrorHandler();
  const [status, pixel, connectDispatch, lastError] = usePixelConnect();
  const [rollState] = usePixelValue(pixel, "rollState");

  useEffect(() => {
    errorHandler(lastError);
  }, [errorHandler, lastError]);

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
        <PixelScanList
          onSelected={(sp) => connectDispatch("connect", getPixel(sp))}
        />
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
