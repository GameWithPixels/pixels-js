import { BaseVStack } from "@systemic-games/react-native-base-components";
import {
  ScannedPixel,
  getPixel,
  usePixelConnect,
  usePixelEvent,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Text } from "react-native-paper";

import { AppPage } from "~/components/AppPage";
import { ScannedPixelsList } from "~/components/ScannedPixelsList";
import { useErrorWithHandler } from "~/hooks/useErrorWithHandler";

function RollPage() {
  const [status, pixel, connectDispatch, lastError] = usePixelConnect();
  const [rollEv] = usePixelEvent(pixel, "roll");
  useErrorWithHandler(lastError);

  const onSelect = React.useCallback(
    (sp: ScannedPixel) => connectDispatch("connect", getPixel(sp.systemId)),
    [connectDispatch]
  );

  const isConnecting = status === "connecting" || status === "identifying";
  const backgroundColor =
    !status || isConnecting
      ? "yellow"
      : status !== "ready"
        ? "red"
        : rollEv?.state !== "onFace"
          ? "blue"
          : "green";
  return (
    <>
      {!pixel ? (
        <ScannedPixelsList onSelect={onSelect} />
      ) : (
        <Pressable
          style={{ backgroundColor }}
          onPress={() => connectDispatch("disconnect")}
        >
          <BaseVStack
            width="100%"
            height="100%"
            alignItems="center"
            justifyContent="center"
          >
            {isConnecting ? (
              <Text style={styles.text}>...</Text>
            ) : (
              status === "ready" &&
              rollEv &&
              rollEv.state !== "unknown" && (
                <Text style={styles.text}>{rollEv.face}</Text>
              )
            )}
          </BaseVStack>
        </Pressable>
      )}
    </>
  );
}

export function RollScreen() {
  return (
    <AppPage pt={0} px={0}>
      <RollPage />
    </AppPage>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 250,
    fontWeight: "bold",
    color: "white",
  },
});
