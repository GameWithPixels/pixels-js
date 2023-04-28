import Slider from "@react-native-community/slider";
import { useFocusEffect } from "@react-navigation/native";
import {
  FastVStack,
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
import React from "react";
import { useErrorHandler } from "react-error-boundary";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { Button, ProgressBar, Text } from "react-native-paper";

import { AppPage } from "~/components/AppPage";
import { LineChart } from "~/components/LineChart";
import PixelInfoCard from "~/components/PixelInfoCard";
import useFocusScannedPixelNotifiers from "~/features/hooks/useFocusScannedPixelNotifiers";
import { pixelTransferTest } from "~/features/pixels/extensions";
import gs from "~/styles";

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
    useFocusScannedPixelNotifiers({
      sortedByName: true,
      minUpdateInterval: 200,
    });

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
      {lastError && <Text style={gs.bold}>{`${lastError}`}</Text>}
      <FlatList
        style={gs.fullWidth}
        data={scannedPixels}
        renderItem={renderItem}
        contentContainerStyle={gs.listContentContainer}
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
      {lastError && <Text style={gs.bold}>{`${lastError}`}</Text>}
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
  const [transferSize, settTransferSize] = React.useState<number>(10000);
  const [progress, setProgress] = React.useState<number>();
  const [points, setPoints] = React.useState<Point[]>([]);
  const dataRate = React.useMemo(() => new DataRate(), []);
  const send = React.useCallback(() => {
    pixelTransferTest(pixel, transferSize, (bytesCount: number) => {
      setProgress(bytesCount / transferSize);
      if (!bytesCount) {
        dataRate.reset();
      } else {
        dataRate.push(bytesCount);
      }
      setPoints(dataRate.points);
    })
      .catch(errorHandler)
      .finally(() => setProgress(1));
  }, [dataRate, errorHandler, pixel, transferSize]);
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
          />
          <Button
            mode="contained-tonal"
            onPress={send}
            disabled={progress !== undefined && progress !== 1}
          >
            Start
          </Button>
          <Text>Progress: {Math.floor(100 * (progress ?? 0))}%</Text>
          <ProgressBar progress={progress} />
          <LineChart
            style={{ width: "100%", height: 300 }}
            points={points}
            fontSize={15}
          />
          <Text>X: seconds, Y: bytes/second</Text>
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
    <FastVStack flex={1} w="100%">
      {!pixelInfo ? (
        <SelectPixel onSelect={setPixelInfo} />
      ) : (
        <RunTest pixelInfo={pixelInfo} />
      )}
    </FastVStack>
  );
}

export default function () {
  return (
    <AppPage>
      <TransferTestPage />
    </AppPage>
  );
}
