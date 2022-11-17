import { useIsFocused } from "@react-navigation/native";
import {
  Scanner,
  ScannedPeripheral,
} from "@systemic-games/react-native-bluetooth-le";
import {
  startDfu,
  DfuState,
} from "@systemic-games/react-native-nordic-nrf5-dfu";
import {
  toFullUuid,
  PixelDesignAndColorValues,
  PixelRollStateValues,
  PixelUuids,
  ScannedPixel,
} from "@systemic-games/react-native-pixels-connect";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useErrorHandler } from "react-error-boundary";
import {
  StyleSheet,
  Text,
  View,
  Button,
  FlatList,
  ListRenderItemInfo,
  Switch,
  // eslint-disable-next-line import/namespace
} from "react-native";

import AppPage from "~/components/AppPage";
import DfuFile from "~/components/DfuFile";
import PixelInfoBox from "~/components/PixelInfoBox";
import Spacer from "~/components/Spacer";
import getDfuFileInfo from "~/features/dfu/getDfuFileInfo";
import usePixelScannerWithFocus from "~/features/pixels/hooks/usePixelScannerWithFocus";
import { DfuScreenProps } from "~/navigation";
import globalStyles, { sr } from "~/styles";
import toLocaleDateTimeString from "~/utils/toLocaleDateTimeString";

type ExtendedDfuState = DfuState | "Initializing";

function DfuPage({ route }: DfuScreenProps) {
  const errorHandler = useErrorHandler();
  const dfuFilePath = route.params.dfuFilePath;
  const isFocusedRef = useRef(true);
  isFocusedRef.current = useIsFocused();
  const [scannedPixels, scannerDispatch] = usePixelScannerWithFocus();
  const [scannedDfuTargets, setScannedDfuTargets] = useState<
    ScannedPeripheral[]
  >([]);
  const [dfuTargetScan, setDfuTargetScan] = useState(false);
  const [filterUpToDate, setFilterUpToDate] = useState(true);
  const [updateQueue, setUpdateQueue] = useState<ScannedPixel[]>([]);
  const [dfuState, setDfuState] = useState<ExtendedDfuState>();
  const [dfuProgress, setDfuProgress] = useState(0);

  const fileInfo = useMemo(() => {
    console.log(dfuFilePath);
    return getDfuFileInfo(dfuFilePath);
  }, [dfuFilePath]);

  // Switch scan target
  useEffect(() => {
    if (dfuTargetScan) {
      scannerDispatch("stop");
      setScannedDfuTargets([]);
      Scanner.start(toFullUuid(PixelUuids.dfuServiceShortUuid), (p) => {
        setScannedDfuTargets((targets) => {
          if (targets.every((target) => target.address !== p.address)) {
            return [...targets, p];
          }
          return targets;
        });
      });
      return () => Scanner.stop();
    } else {
      scannerDispatch("clear");
      scannerDispatch("start");
      return () => {};
    }
  }, [dfuTargetScan, scannerDispatch]);

  // Add Pixels to the DFU queue (if not already queued)
  const queueDfu = (pixels: ScannedPixel[]) => {
    setUpdateQueue((queuedPixels) => {
      console.log(`Queuing DFU for ${pixels.map((p) => p.name).join(", ")}`);
      const toAdd = pixels.filter((p) =>
        queuedPixels.every((q) => q.address !== p.address)
      );
      if (toAdd.length) {
        return [...queuedPixels, ...toAdd];
      }
      return queuedPixels;
    });
  };

  // Trigger DFU
  const triggerDfu = useCallback(
    (pixel: ScannedPixel) => {
      //TODO reset error updateLastError();
      setDfuState("Initializing");
      setDfuProgress(0);
      console.log(
        `Starting DFU for Pixel ${pixel.name} with file ${dfuFilePath}`
      );
      startDfu(pixel.address, dfuFilePath, {
        deviceName: pixel.name,
        dfuStateListener: ({ state }) => {
          console.log(`DFU state: ${state}`);
          setDfuState(state);
        },
        dfuProgressListener: ({ percent }) => {
          setDfuProgress(percent);
        },
      }).catch((error) => {
        if (isFocusedRef.current) {
          //TODO display error per Pixel
          if (
            fileInfo.type === "bootloader" &&
            error === "FW version failure"
          ) {
            //TODO need better handling of bootloader version error
            error = `Bootloader on Pixel ${pixel.name} is same or more recent`;
          }
          errorHandler(error);
          setDfuState("dfuAborted");
        }
      });
    },
    [dfuFilePath, fileInfo.type, isFocusedRef, errorHandler]
  );

  // Watch DFU state and update queue to trigger the next DFU
  useEffect(() => {
    if (dfuState === "dfuCompleted" || dfuState === "dfuAborted") {
      // Remove Pixel from queue on DFU completion
      setDfuState(undefined);
      setUpdateQueue((queue) => queue.slice(1));
    } else if (updateQueue.length && !dfuState) {
      // Trigger DFU if none is going on (=> dfuState is undefined)
      triggerDfu(updateQueue[0]);
    }
  }, [dfuState, updateQueue, triggerDfu]);

  // List of scanned Pixels and DFU targets
  const [compositeList, setCompositeList] = useState<ScannedPixel[]>([]);
  useEffect(
    () =>
      setCompositeList(
        dfuTargetScan
          ? scannedDfuTargets.map((p) => {
              // Transform scanned peripheral into scanned Pixel
              return {
                systemId: p.systemId,
                pixelId: 0,
                address: p.address,
                name: p.name,
                rssi: 0,
                ledCount: 0,
                designAndColor: PixelDesignAndColorValues.unknown,
                rollState: PixelRollStateValues.unknown,
                currentFace: 0,
                batteryLevel: 0,
                buildTimestamp: 0,
              };
            })
          : scannedPixels
      ),
    [dfuTargetScan, scannedDfuTargets, scannedPixels]
  );

  // List of Pixels that have a different firmware
  // and that are not yet queued for an update
  const [updatableList, setUpdatableList] = useState<ScannedPixel[]>([]);
  useEffect(() => {
    setUpdatableList(
      compositeList.filter(
        (pixel) =>
          // Check if already queued for update
          updateQueue.every((p) => p.address !== pixel.address) &&
          // Round firmware build timestamp to the minute
          (!filterUpToDate ||
            fileInfo.type === "bootloader" ||
            fileInfo?.date?.getTime() !==
              Math.floor(pixel.buildTimestamp / 60) * 60000)
      )
    );
  }, [
    compositeList,
    fileInfo?.date,
    fileInfo.type,
    filterUpToDate,
    updateQueue,
  ]);

  // Human readable string showing current DFU status
  const updateStatusStr =
    dfuState === "dfuStarting" && dfuProgress > 0
      ? `Uploading ${fileInfo.type}: ${dfuProgress}%`
      : `DFU state: ${dfuState ?? ""}`;

  // Render scanned Pixel info and DFU status
  const renderScannedPixel = (itemInfo: ListRenderItemInfo<ScannedPixel>) => {
    const pixel = itemInfo.item;
    const date = new Date(pixel.buildTimestamp * 1000);
    const dateTimeStr = toLocaleDateTimeString(date);
    const isUpdating = updateQueue[0]?.address === pixel.address;
    const isQueued = !updateQueue.every((p) => p.address !== pixel.address);
    const isUpdatable = !updatableList.every(
      (p) => p.address !== pixel.address
    );
    const status = isUpdating
      ? updateStatusStr
      : isQueued
      ? `Queued ${fileInfo.type} update`
      : "Up-to-date :)";
    return (
      <View style={styles.box}>
        <PixelInfoBox pixel={pixel}>
          <Text style={styles.textBold}>{`Firmware: ${dateTimeStr}`}</Text>
          {isUpdatable ? (
            <Button onPress={() => queueDfu([pixel])} title="Queue Update" />
          ) : (
            <Text style={styles.textItalic}>{status}</Text>
          )}
        </PixelInfoBox>
      </View>
    );
  };

  return (
    <>
      <Spacer />
      <View style={styles.box}>
        <DfuFile fileInfo={fileInfo} />
      </View>
      <Spacer />
      <Spacer />
      <View style={styles.box}>
        <Text style={styles.textBold}>Scan Options:</Text>
        <Spacer />
        <View style={styles.containerHorizontal}>
          <Text style={styles.text}>DFU Target Scan</Text>
          <Switch onValueChange={setDfuTargetScan} value={dfuTargetScan} />
        </View>
        <Spacer />
        {fileInfo.type !== "bootloader" && (
          <View style={styles.containerHorizontal}>
            <Text style={styles.text}>Check Up-To-Date</Text>
            <Switch onValueChange={setFilterUpToDate} value={filterUpToDate} />
          </View>
        )}
      </View>
      <Spacer />
      <Spacer />
      {compositeList.length ? (
        <>
          {updatableList.length ? (
            <Button
              onPress={() => queueDfu(updatableList)}
              title={`Update All! (${updatableList.length} / ${compositeList.length})`}
            />
          ) : (
            <Text style={styles.textBold}>
              {updateQueue.length
                ? `All updates queued (${updateQueue.length})`
                : `All up-to-date! (${compositeList.length})`}
            </Text>
          )}
          {updateQueue.length > 0 && (
            <View style={styles.boxYellow}>
              <Text
                style={styles.textBold}
              >{`Update in progress! (${updateQueue.length} left)`}</Text>
              <Text style={styles.text}>
                • Keep your device close to your die
              </Text>
              <Text style={styles.text}>• Do not close the app</Text>
              <Text style={styles.text}>
                • Do not turn off neither your device nor your die
              </Text>
              <Text style={styles.text}>
                • Do not lock your screen or let your device go to sleep
              </Text>
              <Spacer />
              <Text
                style={styles.text}
              >{`Update status of ${updateQueue[0]?.name}:`}</Text>
              <Text style={styles.textItalic}>{updateStatusStr}</Text>
            </View>
          )}
          <Spacer />
          <View style={styles.containerScanList}>
            <FlatList
              ItemSeparatorComponent={Spacer}
              data={compositeList}
              renderItem={renderScannedPixel}
              keyExtractor={(p) => p.address.toString()}
              contentContainerStyle={{ flexGrow: 1 }}
            />
          </View>
        </>
      ) : (
        <Text style={styles.text}>No Pixel found so far...</Text>
      )}
    </>
  );
}

export default function (props: DfuScreenProps) {
  return (
    <AppPage style={styles.container}>
      <DfuPage {...props} />
    </AppPage>
  );
}

const styles = StyleSheet.create({
  ...globalStyles,
  containerScanList: {
    alignItems: "center",
    justifyContent: "flex-start",
    margin: sr(10),
    flex: 1,
    flexGrow: 1,
  },
  boxYellow: {
    ...globalStyles.box,
    backgroundColor: "yellow",
    borderColor: "black",
    borderWidth: sr(2),
    padding: sr(10),
    margin: sr(10),
  },
});
