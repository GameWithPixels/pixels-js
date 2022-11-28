import { Button, HStack, Text, VStack } from "native-base";
import { useEffect, useState } from "react";

import ProgressBar from "./ProgressBar";

import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import usePixelBattery from "~/features/pixels/hooks/usePixelBattery";
import usePixelRoll from "~/features/pixels/hooks/usePixelRoll";
import usePixelRssi from "~/features/pixels/hooks/usePixelRssi";
import usePixelStatus from "~/features/pixels/hooks/usePixelStatus";
import usePixelTelemetry from "~/features/pixels/hooks/usePixelTelemetry";
import usePixelTemperature from "~/features/pixels/hooks/usePixelTemperature";
import { sr } from "~/styles";

export default function ({
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
      <Text bold>{`Name: ${pixel.name}`}</Text>
      <Text my={sr(5)}>{`Status: ${status}`}</Text>
      <Text>{`Pixel Id: ${pixel.pixelId}`}</Text>
      <Text>{`LEDs Count: ${pixel.ledCount}, ${pixel.designAndColor}`}</Text>
      <Text>{`Firmware: ${pixel.firmwareDate}`}</Text>
      <Text>{`Battery: ${batteryInfo?.level}%, ${voltage}V, ${chargeState}`}</Text>
      <Text>{`Temperature: ${temperature?.temperature}C`}</Text>
      <Text>{`RSSI: ${Math.round(rssi ?? 0)}`}</Text>
      <Text>{`Roll State: ${face}, ${rollState}`}</Text>
      <Text>{`Acceleration: ${acc}`}</Text>
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
      {updateProgress !== undefined && <ProgressBar percent={updateProgress} />}
      {lastError && (
        <>
          <Text color="red.500">{`Error: ${lastError}`}</Text>
          <Button onPress={() => setLastError(undefined)}>Clear Error</Button>
        </>
      )}
    </VStack>
  );
}
