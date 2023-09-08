import { BaseVStack } from "@systemic-games/react-native-base-components";
import {
  ScannedPixel,
  getPixel,
  usePixelConnect,
  usePixelValue,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Text } from "react-native-paper";

import { AppPage } from "~/components/AppPage";
import { ScannedPixelsList } from "~/components/ScannedPixelsList";
import { useErrorWithHandler } from "~/features/hooks/useErrorWithHandler";

function RollPage() {
  const [status, pixel, connectDispatch, lastError] = usePixelConnect();
  const [rollState] = usePixelValue(pixel, "rollState");
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
      : rollState?.state !== "onFace"
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
              rollState &&
              rollState.state !== "unknown" && (
                <Text style={styles.text}>{rollState.face}</Text>
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
