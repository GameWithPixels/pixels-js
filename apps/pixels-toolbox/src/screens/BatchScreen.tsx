import { useFocusEffect } from "@react-navigation/native";
import { Pixel } from "@systemic-games/pixels-core-connect";
import { delay } from "@systemic-games/pixels-core-utils";
import { BaseVStack } from "@systemic-games/react-native-base-components";
import {
  Color,
  getPixel,
  ScannedPixelNotifier,
  usePixelStatus,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { Button, Divider, Text } from "react-native-paper";

import { AppPage } from "~/components/AppPage";
import { useFocusScannedPixelNotifiers } from "~/features/hooks/useFocusScannedPixelNotifiers";
import { getDefaultProfile } from "~/features/pixels/getDefaultProfile";

async function forAllPixels(
  scannedPixels: ScannedPixelNotifier[],
  op: (pixel: Pixel) => Promise<void>,
  abortSignal: AbortSignal,
  onUsingPixel?: (pixel: Pixel) => void
): Promise<void> {
  const pixels = scannedPixels.map(getPixel);
  for (const pixel of pixels) {
    if (abortSignal.aborted) {
      break;
    }
    try {
      console.log("Running operation on Pixel " + pixel.name);
      onUsingPixel?.(pixel);
      await pixel.connect(10000);
      await op(pixel);
    } finally {
      await pixel.disconnect();
    }
  }
}

async function blink(pixel: Pixel): Promise<void> {
  const duration = 1000;
  await pixel.blink(Color.dimGreen, { duration, count: 2 });
  await delay(duration);
}

async function uploadProfile(pixel: Pixel): Promise<void> {
  await pixel.transferDataSet(getDefaultProfile(pixel.dieType));
}

function BatchPage() {
  // Scanned Pixels
  const [scannedPixels, scanDispatch, scanError] =
    useFocusScannedPixelNotifiers();

  // Batch operations
  const [lastError, setLastError] = React.useState<Error>();
  const [batchOp, setBatchOp] =
    React.useState<(pixel: Pixel) => Promise<void>>();

  // Active Pixel
  const [activePixel, setActivePixel] = React.useState<Pixel>();
  const pixelStatus = usePixelStatus(activePixel);

  // Start/stop scanning
  React.useEffect(() => {
    scanDispatch(batchOp ? "stop" : "start");
  }, [batchOp, scanDispatch]);
  useFocusEffect(
    React.useCallback(() => scanDispatch("clear"), [scanDispatch])
  );

  // Run batch
  React.useEffect(() => {
    if (batchOp) {
      const abortController = new AbortController();
      console.log("Starting batch");
      setLastError(undefined);
      forAllPixels(
        scannedPixels,
        batchOp,
        abortController.signal,
        setActivePixel
      )
        .finally(() => {
          console.log("Batch stopped");
          setBatchOp(undefined);
        })
        .catch(setLastError);
      return () => {
        abortController.abort();
      };
    }
  }, [batchOp, scannedPixels]);

  return (
    <BaseVStack flex={1} w="100%" gap={20} alignItems="center">
      {scanError && <Text>{`Scan error! ${scanError}`}</Text>}
      <Text>Found {scannedPixels.length} Pixels dice</Text>
      {!batchOp ? (
        <>
          <Button mode="contained-tonal" onPress={() => scanDispatch("clear")}>
            Clear Scan List
          </Button>
          <Divider bold style={{ width: "90%" }} />
          <Text>Possible actions to run on all dice, 1 by 1:</Text>
          <Button
            mode="contained-tonal"
            onPress={() => setBatchOp(() => blink)}
          >
            Blink
          </Button>
          <Button
            mode="contained-tonal"
            onPress={() => setBatchOp(() => uploadProfile)}
          >
            Update Profile
          </Button>
          {lastError && <Text>{String(lastError)}</Text>}
        </>
      ) : (
        <>
          <Button mode="contained-tonal" onPress={() => setBatchOp(undefined)}>
            Stop
          </Button>
          {!!activePixel && (
            <Text>
              Operating on {activePixel.name}, status is {pixelStatus}
            </Text>
          )}
        </>
      )}
    </BaseVStack>
  );
}

export function BatchScreen() {
  return (
    <AppPage>
      <BatchPage />
    </AppPage>
  );
}
