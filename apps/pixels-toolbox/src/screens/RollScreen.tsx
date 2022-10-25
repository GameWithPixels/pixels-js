import {
  Pixel,
  PixelRollStateValues,
} from "@systemic-games/react-native-pixels-connect";
import { useEffect, useState } from "react";
import { useErrorHandler } from "react-error-boundary";
import {
  StyleSheet,
  Text,
  View,
  // eslint-disable-next-line import/namespace
} from "react-native";

import AppPage from "~/components/AppPage";
import SelectPixel from "~/components/SelectPixel";
import globalStyles, { sr } from "~/styles";
import usePixelRoll from "~/usePixelRoll";
import usePixelStatus from "~/usePixelStatus";

function RollPage() {
  const errorHandler = useErrorHandler();
  const [selectedPixel, setSelectedPixel] = useState<Pixel | undefined>();
  const status = usePixelStatus(selectedPixel);
  const [connectStarted, setConnectStarted] = useState(false);
  const [face, rollState] = usePixelRoll(selectedPixel);

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
      : rollState !== PixelRollStateValues.OnFace
      ? "blue"
      : "green";
  return (
    <>
      {!selectedPixel ? (
        <SelectPixel setSelectedPixel={setSelectedPixel} />
      ) : (
        <View style={[styles.containerRoll, { backgroundColor }]}>
          {isConnecting ? (
            <Text style={styles.textRoll}>...</Text>
          ) : (
            status === "ready" &&
            rollState > 0 && <Text style={styles.textRoll}>{face}</Text>
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
