import { usePixelStatus, usePixelValue } from "@systemic-games/pixels-react";
import { Pixel } from "@systemic-games/react-native-pixels-connect";
import { useEffect, useState } from "react";
import { useErrorHandler } from "react-error-boundary";
import {
  StyleSheet,
  Text,
  View,
  // eslint-disable-next-line import/namespace
} from "react-native";

import AppPage from "~/components/AppPage";
import globalStyles, { sr } from "~/styles";

function RollPage() {
  const errorHandler = useErrorHandler();
  const [selectedPixel] = useState<Pixel | undefined>();
  const status = usePixelStatus(selectedPixel);
  const [connectStarted, setConnectStarted] = useState(false);
  const [rollState] = usePixelValue(selectedPixel, "rollState");

  useEffect(() => {
    setConnectStarted(true);
    selectedPixel?.connect().catch(errorHandler);
    return () => {
      selectedPixel?.disconnect().catch(console.log);
    };
  }, [errorHandler, selectedPixel]);

  // Pixel status is first set to "disconnected" before "connecting"
  // but we don't want display that initial "disconnected" state.
  useEffect(() => {
    if (status !== "disconnected") {
      setConnectStarted(false);
    }
  }, [status]);

  const isConnecting = status === "connecting" || status === "identifying";
  const backgroundColor =
    !status || isConnecting || connectStarted
      ? "yellow"
      : status !== "ready"
      ? "red"
      : rollState?.state !== "onFace"
      ? "blue"
      : "green";
  return (
    <>
      {!selectedPixel ? (
        // <PixelScanList onSelected={setSelectedPixel} />
        <Text>Missing selection component!</Text>
      ) : (
        <View style={[styles.containerRoll, { backgroundColor }]}>
          {isConnecting ? (
            <Text style={styles.textRoll}>...</Text>
          ) : (
            status === "ready" &&
            rollState &&
            rollState.state !== "unknown" && (
              <Text style={styles.textRoll}>{rollState.face}</Text>
            )
          )}
          {/* <Button onPress={() => setSelectedPixel(undefined)} title="Back" /> */}
        </View>
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

const styles = StyleSheet.create({
  ...globalStyles,
  containerRoll: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  textRoll: {
    fontSize: sr(250),
    color: "white",
    fontWeight: "bold",
  },
});
