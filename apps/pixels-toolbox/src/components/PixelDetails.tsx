import { usePixelStatus, usePixelValue } from "@systemic-games/pixels-react";
import { Button, Center, HStack, ITextProps, Text, VStack } from "native-base";
import { memo, useEffect, useState } from "react";

import ProgressBar from "./ProgressBar";

import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import { sr } from "~/styles";

function TextEntry({
  children,
  title,
  ...props
}: { title: string } & ITextProps) {
  return (
    <Text {...props}>
      <Text bold>{title} </Text>
      <Text italic>{children}</Text>
    </Text>
  );
}

function PixelDetailsImpl({
  pixelDispatcher,
}: {
  pixelDispatcher: PixelDispatcher;
}) {
  const [lastError, setLastError] = useState<Error>();
  const [updateProgress, setUpdateProgress] = useState<number>();
  useEffect(() => {
    pixelDispatcher.addEventListener("error", setLastError);
    pixelDispatcher.addEventListener(
      "profileUpdateProgress",
      setUpdateProgress
    );
    return () => {
      pixelDispatcher.removeEventListener("error", setLastError);
      pixelDispatcher.removeEventListener(
        "profileUpdateProgress",
        setUpdateProgress
      );
    };
  }, [pixelDispatcher]);
  const pixel = pixelDispatcher.pixel;
  const status = usePixelStatus(pixel);
  const opt = { refreshInterval: 5000 };
  const [battery] = usePixelValue(pixel, "batteryWithVoltage", opt);
  const [rssi] = usePixelValue(pixel, "rssi", opt);
  const [temperature] = usePixelValue(pixel, "temperature", opt);
  const [rollState] = usePixelValue(pixel, "rollState", opt);
  const [telemetry] = usePixelValue(pixel, "telemetry", opt);

  // Prepare some values
  const voltage = battery?.voltage.toFixed(3);
  const chargeState = battery?.isCharging ? "charging" : "not charging";
  const x = telemetry?.accX ?? 0;
  const y = telemetry?.accY ?? 0;
  const z = telemetry?.accZ ?? 0;
  const acc = `${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)}`;
  return (
    <VStack space={sr(5)}>
      <TextEntry my={sr(5)} title="Status:">
        {status}
      </TextEntry>
      <TextEntry title="Pixel Id:">{pixel.pixelId}</TextEntry>
      <TextEntry title="LEDs:">
        {pixel.ledCount}, {pixel.designAndColor}
      </TextEntry>
      <TextEntry title="Firmware:">{pixel.firmwareDate.toString()}</TextEntry>
      <TextEntry title="Bat:">
        {battery?.level}%, {voltage}V, {chargeState}
      </TextEntry>
      <TextEntry title="RSSI:">{Math.round(rssi ?? 0)}</TextEntry>
      <TextEntry title="Temperature:">{temperature ?? 0}°C</TextEntry>
      <TextEntry title="Roll State:">
        {rollState?.face}, {rollState?.state}
      </TextEntry>
      <TextEntry title="Acc:">{acc}</TextEntry>
      <HStack space={sr(5)}>
        <VStack flex={1} space={sr(5)}>
          <Button onPress={() => pixelDispatcher.dispatch("connect")}>
            Connect
          </Button>
          <Button onPress={() => pixelDispatcher.dispatch("blink")}>
            Blink
          </Button>
          <Button onPress={() => pixelDispatcher.dispatch("calibrate")}>
            Calibrate
          </Button>
        </VStack>
        <VStack flex={1} space={sr(5)}>
          <Button onPress={() => pixelDispatcher.dispatch("disconnect")}>
            Disconnect
          </Button>
          <Button onPress={() => pixelDispatcher.dispatch("playRainbow")}>
            Rainbow
          </Button>
          {/* TODO stop querying for voltage, rssi, etc. */}
          <Button onPress={() => pixelDispatcher.dispatch("updateProfile")}>
            Reset Profile
          </Button>
        </VStack>
      </HStack>
      {updateProgress !== undefined && (
        <Center my={sr(5)}>
          <ProgressBar percent={updateProgress} />
        </Center>
      )}
      {lastError && (
        <>
          <Text color="red.500">{`Error: ${lastError}`}</Text>
          <Button onPress={() => setLastError(undefined)}>Clear Error</Button>
        </>
      )}
    </VStack>
  );
}

export default memo(PixelDetailsImpl);
