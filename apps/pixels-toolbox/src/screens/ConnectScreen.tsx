import { useFocusEffect } from "@react-navigation/native";
import {
  EditAnimationRainbow,
  EditDataSet,
} from "@systemic-games/pixels-edit-animation";
import {
  ScannedPixel,
  Pixel,
  PixelStatus,
  getPixel,
  Color,
} from "@systemic-games/react-native-pixels-connect";
import { useCallback, useEffect, useRef, useState } from "react";
import { ErrorBoundary, useErrorHandler } from "react-error-boundary";
import {
  StyleSheet,
  Text,
  View,
  Button,
  FlatList,
  Alert,
  AlertButton,
  Switch,
  // eslint-disable-next-line import/namespace
} from "react-native";

import AppPage from "~/components/AppPage";
import ErrorFallback from "~/components/ErrorFallback";
import PixelInfoBox from "~/components/PixelInfoBox";
import Spacer from "~/components/Spacer";
import delay from "~/delay";
import getUniquePixelName from "~/getUniquePixelName";
import standardProfile from "~/standardProfile";
import globalStyles, { sr } from "~/styles";
import usePixelScannerWithFocus from "~/usePixelScannerWithFocus";
import usePixelStatus from "~/usePixelStatus";

const rainbowEditDataSet = new EditDataSet({
  animations: [
    new EditAnimationRainbow({
      duration: 6,
      count: 3,
      fade: 0.5,
    }),
  ],
});

const rainbowTravelingEditDataSet = new EditDataSet({
  animations: [
    new EditAnimationRainbow({
      duration: 6,
      count: 3,
      fade: 0.5,
      traveling: true,
    }),
  ],
});

const rainbowLongEditDataSet = new EditDataSet({
  animations: [
    new EditAnimationRainbow({
      duration: 10,
      count: 10,
      fade: 0.5,
    }),
  ],
});

function notifyUser(
  pixel: Pixel,
  message: string,
  withCancel: boolean,
  response: (okCancel: boolean) => void
) {
  const buttons: AlertButton[] = [
    {
      text: "OK",
      onPress: () => response(true),
    },
  ];
  if (withCancel) {
    buttons.push({
      text: "Cancel",
      onPress: () => response(false),
      style: "cancel",
    });
  }
  Alert.alert(`Pixel ${pixel.name}`, message, buttons);
}

function ScannedPixelItem({
  scannedPixel,
  connect,
}: {
  scannedPixel: ScannedPixel;
  connect: () => void;
}) {
  return (
    <View style={styles.box}>
      <PixelInfoBox pixel={scannedPixel}>
        <Button onPress={() => connect()} title="Connect" />
      </PixelInfoBox>
    </View>
  );
}

function PixelItem({
  pixel,
  transferCallback,
}: {
  pixel: Pixel;
  transferCallback: (isTransferring: boolean) => void;
}) {
  const errorHandler = useErrorHandler();
  const status = usePixelStatus(pixel);
  const [transferProgress, setTransferProgress] = useState<number>();
  // Subscribe to notify user event
  useEffect(() => {
    function notifyUserListener(
      message: string,
      withCancel: boolean,
      response: (okCancel: boolean) => void
    ): void {
      notifyUser(pixel, message, withCancel, response);
    }
    pixel.addNotifyUserListener(notifyUserListener);
    return () => pixel.removeNotifyUserListener(notifyUserListener);
  }, [pixel]);
  return (
    <View style={styles.box}>
      <PixelInfoBox pixel={pixel}>
        <>
          <View style={styles.containerHorizontal}>
            <Button
              onPress={() => pixel.disconnect().catch(errorHandler)}
              title="Disconnect"
            />
            {status === "ready" && (
              <>
                <Button
                  onPress={() => pixel.startCalibration().catch(errorHandler)}
                  title="Calibrate"
                />
                <Button
                  onPress={() => {
                    transferCallback(true);
                    setTransferProgress(0);
                    pixel
                      .transferDataSet(standardProfile, setTransferProgress)
                      .finally(() => {
                        transferCallback(false);
                        setTransferProgress(undefined);
                      })
                      .catch((error) => {
                        errorHandler(error);
                      });
                  }}
                  title="Reset Profile"
                />
              </>
            )}
          </View>
          <Spacer />
          {status === "ready" && (
            <>
              <View style={styles.containerHorizontal}>
                <Button
                  onPress={() =>
                    pixel.blink(Color.yellow, { count: 2 }).catch(errorHandler)
                  }
                  title="Blink"
                />
                <Button
                  onPress={() => {
                    const editDataSet = new EditDataSet();
                    editDataSet.animations.push(
                      new EditAnimationRainbow({
                        duration: 6,
                        count: 3,
                        fade: 0.5,
                        traveling: true,
                      })
                    );
                    pixel
                      .playTestAnimation(editDataSet.toDataSet())
                      .catch(errorHandler);
                  }}
                  title="Rainbow"
                />
              </View>
            </>
          )}
        </>
        <Text style={styles.textBold}>
          <Text>{status}</Text>
          <Text>
            {transferProgress !== undefined
              ? ` - transfer: ${Math.round(100 * transferProgress)}%`
              : ""}
          </Text>
        </Text>
      </PixelInfoBox>
    </View>
  );
}

interface HybridPixelData {
  pixelOrScanned: Pixel | ScannedPixel;
  connect?: () => void;
}

function HybridPixelItem({
  data,
  transferCallback,
}: {
  data: HybridPixelData;
  transferCallback: (isTransferring: boolean) => void;
}) {
  if (!(data.pixelOrScanned instanceof Pixel) && !data.connect) {
    //TODO why is this happening after a fast refresh?
    console.error(data.pixelOrScanned instanceof Pixel, data.pixelOrScanned);
    //throw new Error("HybridPixelItem: Invalid arguments");
  }
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {data.pixelOrScanned instanceof Pixel ? (
        <PixelItem
          pixel={data.pixelOrScanned}
          transferCallback={transferCallback}
        />
      ) : data.connect ? (
        <ScannedPixelItem
          scannedPixel={data.pixelOrScanned}
          connect={data.connect}
        />
      ) : (
        <Text>Unexpected state, you may blame the dev!</Text>
      )}
    </ErrorBoundary>
  );
}

function ConnectPage() {
  const errorHandler = useErrorHandler();
  const [scannedPixels, scannerDispatch] = usePixelScannerWithFocus();
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const pixelsRef = useRef<Pixel[]>([]);

  // List of ScannedPixel that are not connected or in the process of being connected
  const [connectablePixels, setConnectablePixels] = useState<ScannedPixel[]>(
    []
  );
  useEffect(() => {
    pixelsRef.current = [...pixels];
    setConnectablePixels(
      scannedPixels.filter((sp) =>
        pixels.every((p) => sp.pixelId !== p.pixelId)
      )
    );
  }, [pixels, scannedPixels]);

  // Disconnect all Pixels when screen is out of focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        pixelsRef.current.forEach((p) => p.disconnect().catch(console.warn));
      };
    }, [])
  );

  const connect = useCallback(
    (scannedPixel: ScannedPixel) => {
      const pixel = getPixel(scannedPixel);
      setPixels((pixels) => [...pixels, pixel]);
      const listener = (status: PixelStatus) => {
        if (status === "disconnected") {
          pixel.removeEventListener("status", listener);
          pixel.disconnect().catch(errorHandler);
          setPixels((pixels) => {
            const i = pixels.indexOf(pixel);
            if (i >= 0) {
              pixels = [...pixels];
              pixels.splice(i, 1);
            }
            return pixels;
          });
        }
      };
      pixel.addEventListener("status", listener);
      pixel.connect().catch(errorHandler);
      return pixel;
    },
    [errorHandler]
  );

  const disconnect = useCallback(
    (pixel: Pixel) => {
      pixel.disconnect().catch(errorHandler);
    },
    [errorHandler]
  );

  // Combined sorted list of all Pixels
  const [allPixels, setAllPixels] = useState<HybridPixelData[]>([]);
  useEffect(
    () =>
      setAllPixels(
        connectablePixels
          .filter((sp) => pixels.every((p) => p.pixelId !== sp.pixelId))
          .map(
            (sp) =>
              ({
                pixelOrScanned: sp,
                connect: () => connect(sp),
              } as HybridPixelData)
          )
          .concat(
            pixels.map(
              (p) =>
                ({
                  pixelOrScanned: p,
                } as HybridPixelData)
            )
          )
          .sort((p1, p2) =>
            getUniquePixelName(p1.pixelOrScanned).localeCompare(
              getUniquePixelName(p2.pixelOrScanned)
            )
          )
      ),
    [connect, connectablePixels, pixels]
  );

  const [isScanning, setIsScanning] = useState(true);
  useEffect(
    () => scannerDispatch(isScanning ? "start" : "stop"),
    [scannerDispatch, isScanning]
  );

  const connectAll = useCallback(() => {
    connectablePixels.forEach(connect);
  }, [connect, connectablePixels]);

  const disconnectAll = useCallback(() => {
    pixels.forEach(disconnect);
  }, [disconnect, pixels]);

  const playAll = useCallback(
    (editDataSet: EditDataSet) => {
      pixels.forEach((p) =>
        p.playTestAnimation(editDataSet.toDataSet()).catch(errorHandler)
      );
    },
    [errorHandler, pixels]
  );

  const playAllSequential = useCallback(
    async (editDataSet: EditDataSet, interval: number) => {
      // Sorting the dice so that D20 is first, but PD6 is last
      const sortedPixels = [...pixels].sort((p1, p2) => {
        const count1 = p1.ledCount === 21 ? -1 : p1.ledCount;
        const count2 = p2.ledCount === 21 ? -1 : p2.ledCount;
        return count2 - count1;
      });
      // Trigger test anim on all connected dice!
      const dataSet = editDataSet.toDataSet();
      try {
        for (const pixel of sortedPixels) {
          await pixel.playTestAnimation(dataSet);
          await delay(interval);
        }
      } catch (error) {
        errorHandler(error);
      }
    },
    [errorHandler, pixels]
  );

  const [transferCounter, setTransferCounter] = useState(0);
  const transferCallback = useCallback(
    (isTransferring: boolean) =>
      setTransferCounter((c) => c + (isTransferring ? 1 : -1)),
    []
  );

  return (
    <>
      <Spacer />
      <View style={styles.containerHorizontal}>
        <Text style={styles.text}>Scan for Pixels</Text>
        <Switch onValueChange={setIsScanning} value={isScanning} />
      </View>
      <Spacer />
      {allPixels.length ? (
        <>
          {connectablePixels.length ? (
            <>
              <Spacer />
              <Button
                onPress={() => scannerDispatch("clear")}
                title="Clear Not Connected"
              />
              <Spacer />
              <Button
                onPress={connectAll}
                title={`Connect All (${connectablePixels.length})`}
              />
            </>
          ) : (
            <Text
              style={styles.textBold}
            >{`All connecting or connected (${allPixels.length})`}</Text>
          )}
          {pixels.length ? (
            <>
              <Spacer />
              <Button
                onPress={disconnectAll}
                title={`Disconnect All (${pixels.length})`}
              />
              <Spacer />
              <Text style={styles.text}>Rainbow All</Text>
              <View style={styles.containerHorizontal}>
                <Button
                  onPress={() => playAll(rainbowEditDataSet)}
                  title="Classic"
                />
                <Button
                  onPress={() => playAll(rainbowTravelingEditDataSet)}
                  title="Traveling Order"
                />
                <Button
                  onPress={() => playAllSequential(rainbowLongEditDataSet, 100)}
                  title="Sequential"
                />
              </View>
            </>
          ) : (
            <Text style={styles.textBold}>All disconnected</Text>
          )}
          <Spacer />
          {transferCounter > 0 && (
            <View style={styles.boxYellow}>
              <Text style={styles.textBold}>Transfer in progress!</Text>
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
            </View>
          )}
          <Text style={styles.textBold}>{`Pixels (${allPixels.length}):`}</Text>
          <Spacer />
          <View style={styles.containerScanList}>
            <FlatList
              ItemSeparatorComponent={Spacer}
              data={allPixels}
              renderItem={(itemInfo) => (
                <HybridPixelItem
                  data={itemInfo.item}
                  transferCallback={transferCallback}
                />
              )}
              keyExtractor={(p) => p.pixelOrScanned.pixelId.toString()}
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

export default function () {
  return (
    <AppPage style={styles.container}>
      <ConnectPage />
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
