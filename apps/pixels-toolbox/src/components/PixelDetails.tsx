import {
  getPixelEnumName,
  PixelBatteryStateValues,
  PixelRollStateValues,
  usePixelStatus,
  usePixelValue,
} from "@systemic-games/react-native-pixels-connect";
import { Button, Center, HStack, ITextProps, Text, VStack } from "native-base";
import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import ProgressBar from "./ProgressBar";

import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import { sr } from "~/styles";

function TextEntry({
  children,
  title,
  ...props
}: { title: string } & ITextProps) {
  const { t } = useTranslation();
  return (
    <Text {...props}>
      <Text bold>
        {title}
        {t("colonSeparator")}
      </Text>
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
  const [telemetry] = usePixelValue(pixel, "telemetry", { minInterval: 1000 });

  // Prepare some values
  const { t } = useTranslation();
  const x = telemetry?.accX ?? 0;
  const y = telemetry?.accY ?? 0;
  const z = telemetry?.accZ ?? 0;
  const acc = `${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)}`;
  return (
    <VStack space={sr(5)}>
      <Text variant="h2">{pixelDispatcher.name}</Text>
      <TextEntry my={sr(5)} title={t("status")}>
        {status ? t(status) : ""}
      </TextEntry>
      <TextEntry title={t("pixelId")}>{pixel.pixelId}</TextEntry>
      <TextEntry title={t("leds")}>
        {pixel.ledCount}, {pixel.designAndColor}
      </TextEntry>
      <TextEntry title={t("firmware")}>
        {pixel.firmwareDate.toString()}
      </TextEntry>
      <TextEntry title={t("battery")}>
        {t("percentWithValue", { value: telemetry?.batteryLevelPercent ?? 0 })}
        {t("commaSeparator")}
        {t("voltageWithValue", {
          value: telemetry ? telemetry.voltageTimes50 / 50 : 0,
        })}
      </TextEntry>
      <TextEntry title={t("coil")}>
        {t("voltageWithValue", {
          value: telemetry ? telemetry.vCoilTimes50 / 50 : 0,
        })}
      </TextEntry>
      <TextEntry title={t("internalChargerState")}>
        {t(telemetry?.internalChargeState ? "chargerOn" : "chargerOff")}
      </TextEntry>
      <TextEntry title={t("internalChargerOverrideState")}>
        {t(
          telemetry?.forceDisableChargingState
            ? "disallowCharging"
            : "allowCharging"
        )}
      </TextEntry>
      <TextEntry title={t("chargingState")}>
        {t(
          getPixelEnumName(telemetry?.batteryState, PixelBatteryStateValues) ??
            "unknown"
        )}
      </TextEntry>
      <TextEntry title={t("rssi")}>
        {t("dBmWithValue", { value: telemetry?.rssi ?? 0 })}
      </TextEntry>
      <TextEntry title={t("mcuTemperature")}>
        {t("celsiusWithValue", {
          value: (telemetry?.mcuTemperatureTimes100 ?? 0) / 100,
        })}
      </TextEntry>
      <TextEntry title={t("batteryTemperature")}>
        {t("celsiusWithValue", {
          value: (telemetry?.batteryTemperatureTimes100 ?? 0) / 100,
        })}
      </TextEntry>
      <TextEntry title={t("rollState")}>
        {telemetry ? telemetry.faceIndex + 1 : 0},{" "}
        {t(
          getPixelEnumName(telemetry?.rollState, PixelRollStateValues) ??
            "unknown"
        )}
      </TextEntry>
      <TextEntry title={t("accelerometer")}>{acc}</TextEntry>
      <HStack space={sr(5)}>
        <VStack flex={1} space={sr(5)}>
          <Button onPress={() => pixelDispatcher.dispatch("connect")}>
            {t("connect")}
          </Button>
          <Button onPress={() => pixelDispatcher.dispatch("blink")}>
            {t("blink")}
          </Button>
          <Button onPress={() => pixelDispatcher.dispatch("calibrate")}>
            {t("calibrate")}
          </Button>
        </VStack>
        <VStack flex={1} space={sr(5)}>
          <Button onPress={() => pixelDispatcher.dispatch("disconnect")}>
            {t("disconnect")}
          </Button>
          <Button onPress={() => pixelDispatcher.dispatch("playRainbow")}>
            {t("rainbow")}
          </Button>
          {/* TODO stop querying for voltage, rssi, etc. */}
          <Button onPress={() => pixelDispatcher.dispatch("updateProfile")}>
            {t("resetProfile")}
          </Button>
          <Button
            onPress={() => pixelDispatcher.dispatch("exitValidationMode")}
          >
            {t("exitValidationMode")}
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
