import Slider from "@react-native-community/slider";
import { getValueKeyName } from "@systemic-games/pixels-core-utils";
import {
  FastHStack,
  FastVStack,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import {
  Pixel,
  PixelBatteryStateValues,
  PixelRollStateValues,
  usePixelStatus,
  usePixelValue,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import {
  Button as PaperButton,
  ButtonProps,
  Card,
  Modal,
  Portal,
  Text,
  useTheme,
  ModalProps,
} from "react-native-paper";

import ProgressBar from "~/components/ProgressBar";
import useAppBackgroundState from "~/features/hooks/useAppBackgroundState";
import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import { capitalize } from "~/i18n";
import gs, { useModalStyle } from "~/styles";

interface TextEntryBaseProps extends React.PropsWithChildren {
  title: string;
  colonSeparator: string;
}

function TextEntryBase({
  children,
  title,
  colonSeparator,
}: TextEntryBaseProps) {
  return (
    <Text style={gs.mv3} variant="bodyLarge">
      <Text style={gs.bold}>
        {capitalize(title)}
        {colonSeparator}
      </Text>
      <Text style={gs.italic}>{children}</Text>
    </Text>
  );
}

function useTextEntry(colonSeparator: string) {
  return (props: Omit<TextEntryBaseProps, "colonSeparator">) =>
    TextEntryBase({ colonSeparator, ...props });
}

function Button({ ...props }: Omit<ButtonProps, "style">) {
  return <PaperButton style={gs.mv3} mode="contained-tonal" {...props} />;
}

function BaseInfo({ pixel }: { pixel: Pixel }) {
  const { t } = useTranslation();
  const TextEntry = useTextEntry(t("colonSeparator"));
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

  // Values for UI
  const { t } = useTranslation();
  const TextEntry = useTextEntry(t("colonSeparator"));
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

function BottomButtons({
  pixelDispatcher,
}: {
  pixelDispatcher: PixelDispatcher;
}) {
  const { isOpen, onOpen, onClose } = useDisclose();
  const { t } = useTranslation();
  return (
    <>
      <FastHStack>
        <FastVStack flex={1} mr={2}>
          <Button onPress={() => pixelDispatcher.dispatch("connect")}>
            {t("connect")}
          </Button>
          <Button onPress={onOpen}>{t("discharge")}</Button>
          <Button onPress={() => pixelDispatcher.dispatch("enableCharging")}>
            {t("enableCharging")}
          </Button>
          <Button onPress={() => pixelDispatcher.dispatch("blink")}>
            {t("blink")}
          </Button>
          <Button onPress={() => pixelDispatcher.dispatch("blinkId")}>
            {t("blinkId")}
          </Button>
          <Button onPress={() => pixelDispatcher.dispatch("calibrate")}>
            {t("calibrate")}
          </Button>
          <Button onPress={() => pixelDispatcher.dispatch("turnOff")}>
            {t("turnOff")}
          </Button>
        </FastVStack>
        <FastVStack flex={1} ml={2}>
          <Button onPress={() => pixelDispatcher.dispatch("disconnect")}>
            {t("disconnect")}
          </Button>
          <Button onPress={() => pixelDispatcher.dispatch("discharge", 0)}>
            {t("stopDischarge")}
          </Button>
          <Button
            onPress={() => pixelDispatcher.dispatch("enableCharging", false)}
          >
            {t("disableCharging")}
          </Button>
          <Button onPress={() => pixelDispatcher.dispatch("playRainbow")}>
            {t("rainbow")}
          </Button>
          <Button onPress={() => pixelDispatcher.dispatch("uploadProfile")}>
            {t("resetProfile")}
          </Button>
          <Button onPress={() => pixelDispatcher.dispatch("exitValidation")}>
            {t("exitValidationMode")}
          </Button>
        </FastVStack>
      </FastHStack>

      <DischargeModal
        pixelDispatcher={pixelDispatcher}
        visible={isOpen}
        onDismiss={onClose}
      />
    </>
  );
}

function DischargeModal({
  pixelDispatcher,
  ...props
}: {
  pixelDispatcher: PixelDispatcher;
} & Omit<ModalProps, "children">) {
  // Discharge current in mA
  const [current, setCurrent] = React.useState(50);
  React.useEffect(() => {
    if (props.visible) {
      pixelDispatcher.dispatch("discharge", props.visible && current);
    }
  }, [current, pixelDispatcher, props.visible]);
  const modalStyle = useModalStyle();
  const { t } = useTranslation();
  return (
    <Portal>
      <Modal contentContainerStyle={modalStyle} {...props}>
        <Text style={gs.mv3} variant="bodyLarge">
          {t("dischargeCurrentWithValue", { current })}
        </Text>
        <Slider
          value={current}
          minimumValue={10}
          maximumValue={160}
          step={10}
          onValueChange={setCurrent}
        />
        <FastHStack pt={20} justifyContent="space-around">
          <Button
            onPress={() => {
              pixelDispatcher.dispatch("discharge", 0);
              props.onDismiss?.();
            }}
          >
            {t("cancel")}
          </Button>
          <Button onPress={props.onDismiss}>{t("ok")}</Button>
        </FastHStack>
      </Modal>
    </Portal>
  );
}

function FirmwareUpdateModal({ updateProgress }: { updateProgress?: number }) {
  const modalStyle = useModalStyle();
  const { t } = useTranslation();
  return (
    <Portal>
      <Modal visible={!!updateProgress} contentContainerStyle={modalStyle}>
        <Text style={gs.mv3} variant="bodyLarge">
          {t("updatingProfile") + t("colonSeparator")}
        </Text>
        <ProgressBar percent={updateProgress ?? 0} />
      </Modal>
    </Portal>
  );
}

function ErrorCard({ error, clear }: { error: Error; clear: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <>
      <Text
        style={{
          color: theme.colors.error,
          fontWeight: "bold",
          padding: 10,
          borderColor: theme.colors.errorContainer,
          borderWidth: 3,
          borderRadius: 8,
          marginTop: 20,
          marginBottom: 10,
          marginHorizontal: 10,
        }}
        variant="bodyLarge"
      >
        {`${error}`}
      </Text>
      <PaperButton
        style={{
          margin: 10,
        }}
        mode="outlined"
        onPress={clear}
      >
        {t("clearError")}
      </PaperButton>
    </>
  );
}

export function PixelDetails({
  pixelDispatcher,
}: {
  pixelDispatcher: PixelDispatcher;
}) {
  // Error handling
  const [lastError, setLastError] = React.useState<Error>();
  const clearError = React.useCallback(() => setLastError(undefined), []);

  // Profile upload
  const [uploadProgress, setUploadProgress] = React.useState<number>();
  React.useEffect(() => {
    pixelDispatcher.addEventListener("error", setLastError);
    pixelDispatcher.addEventListener(
      "profileUploadProgress",
      setUploadProgress
    );
    return () => {
      pixelDispatcher.removeEventListener("error", setLastError);
      pixelDispatcher.removeEventListener(
        "profileUploadProgress",
        setUploadProgress
      );
    };
  }, [pixelDispatcher]);

  // Pixel
  const pixel = pixelDispatcher.pixel;
  const status = usePixelStatus(pixel);

  // Values for UI
  const { t } = useTranslation();
  const TextEntry = useTextEntry(t("colonSeparator"));
  return (
    <>
      <Card>
        <Card.Title
          titleVariant="headlineMedium"
          title={pixelDispatcher.name}
        />
        <Card.Content>
          <View style={gs.mv3}>
            <TextEntry title={t("status")}>{status ? t(status) : ""}</TextEntry>
          </View>
          <BaseInfo pixel={pixel} />
          <TelemetryInfo pixel={pixel} />
          {lastError ? (
            <ErrorCard error={lastError} clear={clearError} />
          ) : (
            <BottomButtons pixelDispatcher={pixelDispatcher} />
          )}
        </Card.Content>
      </Card>

      <FirmwareUpdateModal updateProgress={uploadProgress} />
    </>
  );
}
