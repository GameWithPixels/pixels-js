import { Button, Center, HStack, ITextProps, Text, VStack } from "native-base";
import { memo, useEffect, useState } from "react";

import ProgressBar from "./ProgressBar";

import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import usePixelBattery from "~/features/pixels/hooks/usePixelBattery";
import usePixelRoll from "~/features/pixels/hooks/usePixelRoll";
import usePixelRssi from "~/features/pixels/hooks/usePixelRssi";
import usePixelStatus from "~/features/pixels/hooks/usePixelStatus";
import usePixelTelemetry from "~/features/pixels/hooks/usePixelTelemetry";
import usePixelTemperature from "~/features/pixels/hooks/usePixelTemperature";
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
  // TODO should be active by default?
  const opt = { refreshInterval: 5000, alwaysActive: true };
  const [batteryInfo] = usePixelBattery(pixel, opt);
  const [rssi] = usePixelRssi(pixel, opt);
  const [face, rollState] = usePixelRoll(pixel);
  const [telemetry] = usePixelTelemetry(pixel, opt);
  const [temperature] = usePixelTemperature(pixel, opt);
  const voltage = batteryInfo?.voltage.toFixed(3);
  const chargeState = batteryInfo?.isCharging ? "charging" : "not charging";
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
      <TextEntry title="LEDs Count:">
        {pixel.ledCount}, {pixel.designAndColor}
      </TextEntry>
      <TextEntry title="Firmware:">{pixel.firmwareDate.toString()}</TextEntry>
      <TextEntry title="Battery:">
        {batteryInfo?.level}%, {voltage}V, {chargeState}
      </TextEntry>
      <TextEntry title="RSSI:">{Math.round(rssi ?? 0)}</TextEntry>
      <TextEntry title="Temperature:">
        {temperature?.temperature ?? 0}C
      </TextEntry>
      <TextEntry title="Roll State:">
        {face}, {rollState}
      </TextEntry>
      <TextEntry title="Acceleration:">{acc}</TextEntry>
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
