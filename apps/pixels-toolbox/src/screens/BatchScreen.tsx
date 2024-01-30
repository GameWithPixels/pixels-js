import { useFocusEffect } from "@react-navigation/native";
import { Pixel } from "@systemic-games/pixels-core-connect";
import { delay } from "@systemic-games/pixels-core-utils";
import {
  createDataSetForAnimation,
  EditAnimationKeyframed,
  EditPattern,
} from "@systemic-games/pixels-edit-animation";
import {
  BaseHStack,
  BaseVStack,
} from "@systemic-games/react-native-base-components";
import {
  Color,
  getPixelOrThrow,
  usePixelStatus,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { ScrollView } from "react-native";
import { Button, Divider, Switch, Text } from "react-native-paper";

import { AppPage } from "~/components/AppPage";
import { PatternImages } from "~/features/PatternImages";
import { createPatternFromImage } from "~/features/createPatternFromImage";
import { getDefaultDataset } from "~/features/pixels/getDefaultProfile";
import { useFocusScannedPixelNotifiers } from "~/hooks/useFocusScannedPixelNotifiers";

const patternsCache = new Map<string | number, EditPattern>();

async function getPatternFromImage(
  virtualAssetModule: string | number
): Promise<EditPattern> {
  const cachedPattern = patternsCache.get(virtualAssetModule);
  if (cachedPattern) {
    return cachedPattern;
  }
  const pattern = await createPatternFromImage(virtualAssetModule);
  patternsCache.set(virtualAssetModule, pattern);
  return pattern;
}

async function forAllPixels(
  pixels: Pixel[],
  stayConnected: boolean,
  op: (pixel: Pixel) => Promise<void>,
  abortSignal: AbortSignal,
  onUsingPixel?: (
    pixel: Pixel,
    status: "connecting" | "starting" | "done" | Error
  ) => void
): Promise<void> {
  for (const pixel of pixels) {
    if (abortSignal.aborted) {
      break;
    }
    console.log(`Running operation on Pixel ${pixel.name}`);
    try {
      onUsingPixel?.(pixel, "connecting");
      await pixel.connect(10000);
      if (abortSignal.aborted) {
        await pixel.disconnect();
        break;
      }
      onUsingPixel?.(pixel, "starting");
      await op(pixel);
      if (!stayConnected) {
        await pixel.disconnect();
      }
      onUsingPixel?.(pixel, "done");
    } catch (error) {
      try {
        if (!stayConnected) {
          await pixel.disconnect();
        }
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
  await pixel.transferDataSet(getDefaultDataset(pixel.dieType));
}

async function testAnimation(pixel: Pixel): Promise<void> {
  const pattern = await getPatternFromImage(
    PatternImages.rainbowFalls
    // PatternImages.circles -> too many keyframes
    // PatternImages.rotatingRings -> too many keyframes
  );
  const anim = new EditAnimationKeyframed({
    duration: 3,
    pattern,
  });
  const dataSet = createDataSetForAnimation(anim).toDataSet();
  await pixel.playTestAnimation(dataSet, (progress) =>
    console.log(`Animation upload progress: ${progress}%`)
  );
}

function BatchPage() {
  // Scanned Pixels
  const [scannedPixels, scanDispatch, scanStatus] =
    useFocusScannedPixelNotifiers();
  const [pixels, setPixels] = React.useState<Pixel[]>([]);
  const [stayConnected, setStayConnected] = React.useState(false);
  React.useEffect(() => {
    if (!stayConnected && pixels.length) {
      setPixels((pixels) => {
        pixels.forEach((p) =>
          p
            .disconnect()
            .catch((e) => console.log(`Error disconnecting ${p.name}: ${e}`))
        );
        return [];
      });
    }
  }, [pixels, stayConnected]);

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
  const runBatchOp = (batchOp: (pixel: Pixel) => Promise<void>) => {
    setBatchOp(() => batchOp);
    setOpsStatuses([]);
    const abortController = new AbortController();
    const pixelsToUse = pixels.concat(
      scannedPixels
        .filter((sp) => !pixels.find((p) => p.pixelId === sp.pixelId))
        .map((sp) => getPixelOrThrow(sp.systemId))
    );
    forAllPixels(
      pixelsToUse,
      stayConnected,
      batchOp,
      abortController.signal,
      (pixel, opStatus) => {
        setActivePixel(pixel);
        if (opStatus === "starting") {
          if (stayConnected) {
            setPixels((pixels) =>
              pixels.includes(pixel) ? pixels : [...pixels, pixel]
            );
          }
        } else if (opStatus !== "connecting") {
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
  };

  const scannedButNotConnected = scannedPixels.filter(
    (sp) => !pixels.find((p) => p.pixelId === sp.pixelId)
  );
  return (
    <BaseVStack flex={1} w="100%" gap={10} alignItems="center">
      {!(typeof scanStatus === "string") && (
        <Text>{`Scan error! ${scanStatus}`}</Text>
      )}
      {!batchOp ? (
        <>
          <Text variant="titleMedium">Scanning for dice...</Text>
          <Text variant="bodySmall" numberOfLines={1}>
            {scannedButNotConnected.length
              ? `Found ${
                  scannedButNotConnected.length
                } Pixels: ${scannedButNotConnected
                  .map((p) => p.name)
                  .join(", ")}`
              : "No available Pixels found so far."}
          </Text>
          <Button mode="contained-tonal" onPress={() => scanDispatch("clear")}>
            Clear Scan List
          </Button>
          <Divider bold style={{ width: "90%", marginVertical: 10 }} />
          <Text>Possible actions to run on all dice, 1 by 1:</Text>
          <BaseHStack flexWrap="wrap" justifyContent="center" gap={10}>
            <Button mode="contained-tonal" onPress={() => runBatchOp(blink)}>
              Blink
            </Button>
            <Button
              mode="contained-tonal"
              onPress={() => runBatchOp(uploadProfile)}
            >
              Update Profile
            </Button>
            <Button
              mode="contained-tonal"
              onPress={() => {
                patternsCache.clear();
                runBatchOp(testAnimation);
              }}
            >
              Play Kframes
            </Button>
          </BaseHStack>
          <BaseHStack alignItems="center" justifyContent="center" gap={10}>
            <Switch value={stayConnected} onValueChange={setStayConnected} />
            <Text>Stay connected</Text>
          </BaseHStack>
          {stayConnected && (
            <Text variant="bodySmall" numberOfLines={1}>
              {pixels.length
                ? pixels.map((p) => p.name).join(", ")
                : "No connected Pixels yet."}
            </Text>
          )}
        </>
      ) : (
        <>
          <Text variant="titleMedium">Running Selected Action on Dice...</Text>
          {!!activePixel && (
            <Text>
              Operating on {activePixel.name}, status is {pixelStatus}
            </Text>
          )}
          <Button mode="contained-tonal" onPress={() => setBatchOp(undefined)}>
            Request Stop
          </Button>
        </>
      )}
      <Divider bold style={{ width: "90%", marginVertical: 10 }} />
      <Text variant="titleMedium">Completed:</Text>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 10,
          alignItems: "center",
          gap: 5,
        }}
      >
        {opsStatuses.map((s, i) => (
          <Text key={i} variant="bodyLarge">
            {s}
          </Text>
        ))}
      </ScrollView>
    </BaseVStack>
  );
}

export function BatchScreen() {
  return (
    <AppPage pt={10}>
      <BatchPage />
    </AppPage>
  );
}
