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
import { ScrollView } from "react-native";
import { Button, Divider, Text } from "react-native-paper";

import { AppPage } from "~/components/AppPage";
import { useFocusScannedPixelNotifiers } from "~/features/hooks/useFocusScannedPixelNotifiers";
import { getDefaultProfile } from "~/features/pixels/getDefaultProfile";

async function forAllPixels(
  scannedPixels: ScannedPixelNotifier[],
  op: (pixel: Pixel) => Promise<void>,
  abortSignal: AbortSignal,
  onUsingPixel?: (pixel: Pixel, status: "starting" | "done" | Error) => void
): Promise<void> {
  const pixels = scannedPixels.map((sp) => getPixel(sp.systemId));
  for (const pixel of pixels) {
    if (abortSignal.aborted) {
      break;
    }
    console.log("Running operation on Pixel " + pixel.name);
    try {
      onUsingPixel?.(pixel, "starting");
      await pixel.connect(10000);
      if (abortSignal.aborted) {
        await pixel.disconnect();
        break;
      }
      await op(pixel);
      await pixel.disconnect();
      onUsingPixel?.(pixel, "done");
    } catch (error) {
      try {
        await pixel.disconnect();
      } catch {}
      onUsingPixel?.(pixel, error as Error);
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
  const [batchOp, setBatchOp] =
    React.useState<(pixel: Pixel) => Promise<void>>();

  // Progress
  const [opsStatuses, setOpsStatuses] = React.useState<string[]>([]);

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
      setOpsStatuses([]);
      forAllPixels(
        scannedPixels,
        batchOp,
        abortController.signal,
        (pixel, opStatus) => {
          setActivePixel(pixel);
          if (opStatus !== "starting") {
            setOpsStatuses((statuses) => [
              ...statuses,
              `${pixel.name}: ${opStatus}`,
            ]);
          }
        }
      )
        .finally(() => {
          console.log("Batch stopped");
          setBatchOp(undefined);
        })
        .catch((error) => console.error(String(error)));
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
        </>
      ) : (
        <>
          <Button mode="contained-tonal" onPress={() => setBatchOp(undefined)}>
            Stop
          </Button>
          <Divider bold style={{ width: "90%" }} />
          {!!activePixel && (
            <>
              <Text>Operating on {activePixel.name}</Text>
              <Text>Status is {pixelStatus}</Text>
            </>
          )}
        </>
      )}
      <Divider bold style={{ width: "90%" }} />
      <Text>Completed:</Text>
      <ScrollView>
        {opsStatuses.map((s, i) => (
          <Text key={i}>{s}</Text>
        ))}
      </ScrollView>
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
