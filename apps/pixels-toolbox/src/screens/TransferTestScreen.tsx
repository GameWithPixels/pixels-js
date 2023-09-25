import Slider from "@react-native-community/slider";
import { useFocusEffect } from "@react-navigation/native";
import {
  BaseVStack,
  Point,
} from "@systemic-games/react-native-base-components";
import {
  Pixel,
  PixelInfoNotifier,
  ScannedPixelNotifier,
  getPixel,
  usePixelConnect,
  usePixelStatus,
} from "@systemic-games/react-native-pixels-connect";
import FileSystem, { StorageAccessFramework } from "expo-file-system";
import React from "react";
import { useErrorHandler } from "react-error-boundary";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  View,
} from "react-native";
import { Button, ProgressBar, Text } from "react-native-paper";

import { AppStyles } from "~/AppStyles";
import { AppPage } from "~/components/AppPage";
import { LineChart } from "~/components/LineChart";
import { PixelInfoCard } from "~/components/PixelInfoCard";
import Pathname from "~/features/files/Pathname";
import { requestUserFileAsync } from "~/features/files/requestUserFileAsync";
import { useFocusScannedPixelNotifiers } from "~/features/hooks/useFocusScannedPixelNotifiers";
import { pixelTransferTest } from "~/features/pixels/extensions";
import { shareFileAsync } from "~/features/shareFileAsync";
import { toLocaleDateTimeString } from "~/features/toLocaleDateTimeString";

function PixelListItem({
  pixel,
  onSelect,
}: {
  pixel: PixelInfoNotifier;
  onSelect: (pixel: PixelInfoNotifier) => void;
}) {
  const onPress = React.useCallback(() => onSelect(pixel), [onSelect, pixel]);
  return (
    <Pressable onPress={onPress}>
      <PixelInfoCard pixelInfo={pixel} />
    </Pressable>
  );
}

function SelectPixel({
  onSelect,
}: {
  onSelect: (pixel: PixelInfoNotifier) => void;
}) {
  // Scanning
  const [scannedPixels, scannerDispatch, lastError] =
    useFocusScannedPixelNotifiers();

  const [refreshing, setRefreshing] = React.useState(false);

  // FlatList item rendering
  const renderItem = React.useCallback(
    ({ item: scannedPixel }: { item: ScannedPixelNotifier }) => (
      <PixelListItem
        key={scannedPixel.pixelId}
        pixel={scannedPixel}
        onSelect={onSelect}
      />
    ),
    [onSelect]
  );
  const refreshControl = React.useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          scannerDispatch("clear");
          setTimeout(() => {
            // Wait of 1 second before stopping the refresh animation
            setRefreshing(false);
          }, 1000);
        }}
      />
    ),
    [refreshing, scannerDispatch]
  );

  return (
    <>
      <Text>Select Pixel:</Text>
      {lastError && <Text style={AppStyles.bold}>{`${lastError}`}</Text>}
      <FlatList
        style={AppStyles.fullWidth}
        contentContainerStyle={AppStyles.listContentContainer}
        data={scannedPixels}
        renderItem={renderItem}
        refreshControl={refreshControl}
      />
    </>
  );
}

function RunTest({ pixelInfo }: { pixelInfo: PixelInfoNotifier }) {
  const [_status, pixel, _dispatch, lastError] = usePixelConnect(
    getPixel(pixelInfo)
  );
  return (
    <>
      {lastError && <Text style={AppStyles.bold}>{`${lastError}`}</Text>}
      {pixel && <SendData pixel={pixel} />}
    </>
  );
}

class DataRate {
  private readonly _points: Point[] = [];
  private _startTime = 0;
  private _sendBytes = 0;

  get points(): Point[] {
    return [...this._points];
  }

  reset(): void {
    this._points.length = 0;
    this._startTime = DataRate._now();
    this._sendBytes = 0;
  }

  push(sendBytes: number): void {
    const now = DataRate._now() - this._startTime;
    const lastTime = this._points.at(-1)?.x ?? 0;
    const y = (sendBytes - this._sendBytes) / (now - lastTime);
    this._points.push({ x: now, y });
    this._sendBytes = sendBytes;
  }

  static _now(): number {
    return Date.now() / 1000;
  }
}

function SendData({ pixel }: { pixel: Pixel }) {
  const errorHandler = useErrorHandler();
  const status = usePixelStatus(pixel);
  const [transferring, setTransferring] = React.useState(false);
  const [transferSize, settTransferSize] = React.useState<number>(10000);
  const [transferredBytes, setTransferredBytes] = React.useState(0);
  const [points, setPoints] = React.useState<Point[]>([]);
  const duration = React.useMemo(() => points.at(-1)?.x ?? 0, [points]);
  const dataRate = React.useMemo(() => new DataRate(), []);

  // Send data to Pixel
  const send = React.useCallback(() => {
    setTransferring(true);
    pixelTransferTest(pixel, transferSize, (bytesCount: number) => {
      if (!bytesCount) {
        dataRate.reset();
      } else {
        dataRate.push(bytesCount);
      }
      setPoints(dataRate.points);
      setTransferredBytes(bytesCount);
    })
      .catch(errorHandler)
      .finally(() => setTransferring(false));
  }, [dataRate, errorHandler, pixel, transferSize]);

  // Export to CSV file
  const exportCsv = React.useCallback(() => {
    const promise = async () => {
      const now = toLocaleDateTimeString(new Date());
      const basename = `${pixel.name}-transfer-rate-${now}`;
      const filename = Pathname.replaceInvalidCharacters(`${basename}.csv`);
      const contents =
        "timestamp,bytes\n" +
        dataRate.points.map((p) => `${p.x},${p.y}\n`).join();
      console.log(
        `About to write ${contents.length} characters to ${filename}`
      );
      if (Platform.OS === "android") {
        const uri = await requestUserFileAsync(filename);
        await StorageAccessFramework.writeAsStringAsync(uri, contents);
      } else {
        const uri = await Pathname.generateTempPathnameAsync(".csv");
        try {
          await FileSystem.writeAsStringAsync(uri, contents);
          await shareFileAsync(uri);
        } finally {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        }
      }
    };
    promise().catch(errorHandler);
  }, [dataRate, errorHandler, pixel.name]);

  // UI
  const progress = transferredBytes / transferSize;
  const average = duration > 0 ? transferredBytes / duration : 0;
  return (
    <View style={{ width: "100%", gap: 10 }}>
      <Text variant="headlineMedium" style={{ alignSelf: "center" }}>
        {pixel.name}
      </Text>
      <Text>{`Status ${status}`}</Text>
      {status === "ready" && (
        <>
          <Text>Transfer Size: {transferSize} bytes</Text>
          <Slider
            value={transferSize}
            minimumValue={1000}
            maximumValue={50000}
            step={1000}
            onValueChange={settTransferSize}
            disabled={transferring}
          />
          <Button mode="contained-tonal" onPress={send} disabled={transferring}>
            Start
          </Button>
          <Text>Progress: {Math.floor(100 * progress)}%</Text>
          <ProgressBar progress={progress} />
          <LineChart
            style={{ width: "100%", height: 300, backgroundColor: "gray" }}
            points={points}
            lineColor="blue"
            textColor="cyan"
            fontSize={15}
          />
          <Text>X: seconds, Y: bytes/second</Text>
          <Text>Duration: {duration.toFixed(3)} seconds</Text>
          <Text>Average: {Math.round(average)} bytes/second</Text>
          <Button
            mode="contained-tonal"
            disabled={transferring || transferSize === 0}
            onPress={exportCsv}
          >
            Export To CSV
          </Button>
        </>
      )}
    </View>
  );
}

function TransferTestPage() {
  const [pixelInfo, setPixelInfo] = React.useState<PixelInfoNotifier>();
  // Disconnect when leaving screen
  useFocusEffect(
    React.useCallback(() => {
      return () => setPixelInfo(undefined);
    }, [])
  );
  return (
    <BaseVStack flex={1} w="100%">
      {!pixelInfo ? (
        <SelectPixel onSelect={setPixelInfo} />
      ) : (
        <RunTest pixelInfo={pixelInfo} />
      )}
    </BaseVStack>
  );
}

export function TransferTestScreen() {
  return (
    <AppPage>
      <TransferTestPage />
    </AppPage>
  );
}
