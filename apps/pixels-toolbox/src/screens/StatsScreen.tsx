import {
  Pixel,
  BatteryLevel,
  MessageOrType,
  MessageTypeValues,
} from "@systemic-games/react-native-pixels-connect";
import React, { useEffect, useState } from "react";
import { useErrorHandler } from "react-error-boundary";
import {
  StyleSheet,
  Button,
  Text,
  // eslint-disable-next-line import/namespace
} from "react-native";

import AppPage from "~/components/AppPage";
import SelectPixel from "~/components/SelectPixel";
import Spacer from "~/components/Spacer";
import globalStyles from "~/styles";
import usePixelStatus from "~/usePixelStatus";

function StatsPage() {
  const errorHandler = useErrorHandler();
  const [selectedPixel, setSelectedPixel] = useState<Pixel | undefined>();
  const status = usePixelStatus(selectedPixel);
  const [vbat, setVbat] = useState<number>(0);

  useEffect(() => {
    const batteryListener = (msgOrType: MessageOrType) => {
      if (msgOrType instanceof BatteryLevel) {
        setVbat(msgOrType.voltage);
      }
    };
    selectedPixel?.connect().catch(errorHandler);
    selectedPixel?.addMessageListener("batteryLevel", batteryListener);
    return () => {
      selectedPixel?.removeMessageListener("batteryLevel", batteryListener);
      selectedPixel?.disconnect().catch(console.log);
    };
  }, [errorHandler, selectedPixel]);

  useEffect(() => {
    if (status !== "ready") {
      setVbat(0);
    }
  }, [status]);

  return (
    <AppPage>
      {!selectedPixel ? (
        <SelectPixel setSelectedPixel={setSelectedPixel} />
      ) : (
        <>
          <Text style={styles.text}>{`Connection status: ${status}`}</Text>
          <Spacer />
          <Text style={styles.text}>
            {`Last battery voltage: ${Number(vbat).toFixed(2)} V`}
          </Text>
          <Spacer />
          <Button
            onPress={() => setSelectedPixel(undefined)}
            title="Disconnect"
          />
          {status === "ready" && (
            <>
              <Spacer />
              <Button
                onPress={() =>
                  selectedPixel
                    .sendMessage(MessageTypeValues.requestBatteryLevel)
                    .catch(errorHandler)
                }
                title="Request Battery Level"
              />
            </>
          )}
        </>
      )}
    </AppPage>
  );
}

export default function () {
  return (
    <AppPage>
      <StatsPage />
    </AppPage>
  );
}

const styles = StyleSheet.create({
  ...globalStyles,
});
