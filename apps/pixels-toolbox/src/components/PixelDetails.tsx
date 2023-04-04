import { getValueKeyName } from "@systemic-games/pixels-core-utils";
import {
  FastBox,
  FastButton,
  FastHStack,
  FastVStack,
} from "@systemic-games/react-native-base-components";
import {
  Pixel,
  PixelBatteryStateValues,
  PixelRollStateValues,
  usePixelStatus,
  usePixelValue,
} from "@systemic-games/react-native-pixels-connect";
import { ITextProps, Text } from "native-base";
import React from "react";
import { useTranslation } from "react-i18next";

import ProgressBar from "./ProgressBar";

import useAppBackgroundState from "~/features/hooks/useAppBackgroundState";
import PixelDispatcher from "~/features/pixels/PixelDispatcher";

function TextEntry({
  children,
  title,
  ...props
}: { title: string } & ITextProps) {
  const { t } = useTranslation();
  return (
    <Text mb={1} {...props}>
      <Text bold>
        {title}
        {t("colonSeparator")}
      </Text>
      <Text italic>{children}</Text>
    </Text>
  );
}

function BaseInfo({ pixel }: { pixel: Pixel }) {
  const { t } = useTranslation();
  return (
    <>
      <TextEntry title={t("pixelId")}>{pixel.pixelId}</TextEntry>
      <TextEntry title={t("leds")}>
        {pixel.ledCount}, {pixel.designAndColor}
      </TextEntry>
      <TextEntry title={t("firmware")}>
        {pixel.firmwareDate.toString()}
      </TextEntry>
    </>
  );
}

function TelemetryInfo({ pixel }: { pixel: Pixel }) {
  const [telemetry] = usePixelValue(pixel, "telemetry", { minInterval: 1000 });
  const x = telemetry?.accX ?? 0;
  const y = telemetry?.accY ?? 0;
  const z = telemetry?.accZ ?? 0;
  const acc = `${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)}`;

  const { t } = useTranslation();
  return useAppBackgroundState() === "active" ? (
    <>
      <TextEntry title={t("battery")}>
        {t("percentWithValue", {
          value: telemetry?.batteryLevelPercent ?? 0,
        })}
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
          getValueKeyName(telemetry?.batteryState, PixelBatteryStateValues) ??
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
          getValueKeyName(telemetry?.rollState, PixelRollStateValues) ??
            "unknown"
        )}
      </TextEntry>
      <TextEntry title={t("accelerometer")}>{acc}</TextEntry>
    </>
  ) : (
    <></>
  );
}

const BottomButtons = React.memo(function ({
  pixelDispatcher,
}: {
  pixelDispatcher: PixelDispatcher;
}) {
  const { t } = useTranslation();
  return (
    <FastHStack>
      <FastVStack flex={1} mr={2}>
        <FastButton onPress={() => pixelDispatcher.dispatch("connect")}>
          {t("connect")}
        </FastButton>
        <FastButton
          mt={2}
          onPress={() => pixelDispatcher.dispatch("discharge")}
        >
          {t("discharge")}
        </FastButton>
        <FastButton
          mt={2}
          onPress={() => pixelDispatcher.dispatch("enableCharging")}
        >
          {t("enableCharging")}
        </FastButton>
        <FastButton mt={2} onPress={() => pixelDispatcher.dispatch("blink")}>
          {t("blink")}
        </FastButton>
        <FastButton mt={2} onPress={() => pixelDispatcher.dispatch("blinkId")}>
          {t("blinkId")}
        </FastButton>
        <FastButton
          mt={2}
          onPress={() => pixelDispatcher.dispatch("calibrate")}
        >
          {t("calibrate")}
        </FastButton>
      </FastVStack>
      <FastVStack flex={1} ml={2}>
        <FastButton onPress={() => pixelDispatcher.dispatch("disconnect")}>
          {t("disconnect")}
        </FastButton>
        <FastButton
          mt={2}
          onPress={() => pixelDispatcher.dispatch("stopDischarge")}
        >
          {t("stopDischarge")}
        </FastButton>
        <FastButton
          mt={2}
          onPress={() => pixelDispatcher.dispatch("disableCharging")}
        >
          {t("disableCharging")}
        </FastButton>
        <FastButton
          mt={2}
          onPress={() => pixelDispatcher.dispatch("playRainbow")}
        >
          {t("rainbow")}
        </FastButton>
        <FastButton
          mt={2}
          onPress={() => pixelDispatcher.dispatch("updateProfile")}
        >
          {t("resetProfile")}
        </FastButton>
        <FastButton
          mt={2}
          onPress={() => pixelDispatcher.dispatch("exitValidationMode")}
        >
          {t("exitValidationMode")}
        </FastButton>
      </FastVStack>
    </FastHStack>
  );
});

export default function PixelDetails({
  pixelDispatcher,
}: {
  pixelDispatcher: PixelDispatcher;
}) {
  const [lastError, setLastError] = React.useState<Error>();

  const [updateProgress, setUpdateProgress] = React.useState<number>();
  React.useEffect(() => {
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

  const { t } = useTranslation();
  return (
    <FastVStack>
      <Text variant="h2">{pixelDispatcher.name}</Text>
      <TextEntry mt={2} mb={2} title={t("status")}>
        {status ? t(status) : ""}
      </TextEntry>
      <BaseInfo pixel={pixel} />
      <TelemetryInfo pixel={pixel} />
      {lastError && (
        <>
          <Text color="red.500">{`Error: ${lastError}`}</Text>
          <FastButton mb={2} onPress={() => setLastError(undefined)}>
            Clear Error
          </FastButton>
        </>
      )}
      {updateProgress !== undefined && (
        <FastBox my={10}>
          <Text>{t("updatingFirmware") + t("colonSeparator")}</Text>
          <ProgressBar percent={updateProgress} />
        </FastBox>
      )}
      <BottomButtons pixelDispatcher={pixelDispatcher} />
    </FastVStack>
  );
}
