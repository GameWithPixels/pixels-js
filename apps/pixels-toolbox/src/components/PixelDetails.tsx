import { Ionicons } from "@expo/vector-icons";
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
  Telemetry,
  usePixelStatus,
  usePixelValue,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, useWindowDimensions, View } from "react-native";
import {
  Button as PaperButton,
  ButtonProps,
  Card,
  Divider,
  Modal,
  Portal,
  Switch,
  Text,
  useTheme,
  ModalProps,
} from "react-native-paper";

import {
  DynamicLinesChart,
  DynamicLinesChartHandle,
  DynamicLinesChartProps,
} from "./DynamicLinesChart";

import ProgressBar from "~/components/ProgressBar";
import exportCsv from "~/features/files/exportCsv";
import useAppBackgroundState from "~/features/hooks/useAppBackgroundState";
import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import { PrebuildAnimations } from "~/features/pixels/PrebuildAnimations";
import { capitalize } from "~/i18n";
import gs, { useModalStyle } from "~/styles";

type TelemetryData = {
  timestamp: number;
  rssi: number;
  battery: number;
  voltage: number;
};

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
    <Text variant="bodyLarge">
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
  return <PaperButton mode="contained-tonal" {...props} />;
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

const TelemetryModal = React.forwardRef(function (
  {
    linesInfo,
    ...props
  }: Pick<DynamicLinesChartProps, "linesInfo"> & Omit<ModalProps, "children">,
  ref: React.ForwardedRef<DynamicLinesChartHandle>
) {
  // Values for UI
  const window = useWindowDimensions();
  const modalStyle = useModalStyle();
  const { t } = useTranslation();
  return (
    <Portal>
      <Modal contentContainerStyle={modalStyle} {...props}>
        <Text style={gs.mv3} variant="bodyLarge">
          {t("telemetryGraph")}
        </Text>
        <DynamicLinesChart
          ref={ref}
          style={{
            width: "100%",
            height: window.width,
            backgroundColor: "gainsboro",
          }}
          linesInfo={linesInfo}
          textColor="steelblue"
          fontSize={15}
          title="Time in seconds"
          strokeWidth={1.5}
        />
      </Modal>
    </Portal>
  );
});

interface TelemetryInfoHandle {
  showGraph(): void;
}

const TelemetryInfo = React.forwardRef(function (
  {
    pixel,
    onData,
  }: {
    pixel: Pixel;
    onData?: (data: Telemetry) => void;
  },
  ref: React.ForwardedRef<TelemetryInfoHandle>
) {
  const [telemetry, dispatch] = usePixelValue(pixel, "telemetry", {
    minInterval: 1000,
  });
  const status = usePixelStatus(pixel);

  // Telemetry toggling
  const [telemetryOn, setTelemetryOn] = React.useState(true);
  const appState = useAppBackgroundState();
  React.useEffect(() => {
    if (status === "ready") {
      dispatch(telemetryOn && appState === "active" ? "start" : "stop");
    }
  }, [appState, dispatch, status, telemetryOn]);

  // Graph
  const { isOpen, onOpen, onClose } = useDisclose();
  const graphRef = React.useRef<DynamicLinesChartHandle>(null);
  const linesInfo = React.useMemo(
    () => [
      { title: "RSSI", color: "tomato" },
      { title: "Battery", color: "teal" },
      { title: "Voltage", color: "mediumpurple" },
    ],
    []
  );
  const startTimeRef = React.useRef(0);
  React.useEffect(() => {
    startTimeRef.current = 0;
  }, [isOpen]);
  React.useEffect(() => {
    if (telemetry && graphRef.current) {
      const now = Date.now();
      if (!startTimeRef.current) {
        startTimeRef.current = now;
      }
      const time = Math.round((now - startTimeRef.current) / 1000);
      graphRef.current.push(time, [
        telemetry.rssi,
        telemetry.batteryLevelPercent,
        (telemetry.voltageTimes50 / 50) * 1000,
      ]);
    }
    if (telemetry && onData) {
      onData(telemetry);
    }
  }, [onData, telemetry]);

  // Imperative handle
  React.useImperativeHandle(
    ref,
    () => ({
      showGraph(): void {
        onOpen();
      },
    }),
    [onOpen]
  );

  // Values for UI
  const { t } = useTranslation();
  const TextEntry = useTextEntry(t("colonSeparator"));
  const x = telemetry?.accX ?? 0;
  const y = telemetry?.accY ?? 0;
  const z = telemetry?.accZ ?? 0;
  const acc = `${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)}`;
  return (
    <>
      {telemetryOn && (
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
              getValueKeyName(
                telemetry?.batteryState,
                PixelBatteryStateValues
              ) ?? "unknown"
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
      )}
      <Divider style={{ height: 3, marginVertical: 5 }} />
      <FastHStack w="100%" alignContent="space-around">
        <Text style={[gs.flex, gs.bold]} variant="bodyLarge">
          {t("enableTelemetry")}
        </Text>
        <Switch onValueChange={setTelemetryOn} value={telemetryOn} />
      </FastHStack>

      <TelemetryModal
        ref={graphRef}
        linesInfo={linesInfo}
        visible={isOpen}
        onDismiss={onClose}
      />
    </>
  );
});

function BottomButtons({
  pixelDispatcher,
  onShowTelemetry,
  onExportTelemetry,
}: {
  pixelDispatcher: PixelDispatcher;
  onShowTelemetry?: () => void;
  onExportTelemetry?: () => void;
}) {
  const status = usePixelStatus(pixelDispatcher.pixel);
  const connectStr = status === "disconnected" ? "connect" : "disconnect";
  const { isOpen, onOpen, onClose } = useDisclose();
  const { t } = useTranslation();
  return (
    <>
      <FastHStack gap={6}>
        <FastVStack gap={4}>
          <Button onPress={() => pixelDispatcher.dispatch(connectStr)}>
            {t(connectStr)}
          </Button>
          {status === "ready" && (
            <>
              <Button onPress={onOpen}>{t("discharge")}</Button>
              <Button
                onPress={() => pixelDispatcher.dispatch("enableCharging")}
              >
                {t("enableCharging")}
              </Button>
              <Button onPress={() => pixelDispatcher.dispatch("blink")}>
                {t("blink")}
              </Button>
              <Button
                onPress={() =>
                  pixelDispatcher.dispatch(
                    "playAnimation",
                    PrebuildAnimations.rainbow
                  )
                }
              >
                {t("rainbow")}
              </Button>
              <Button onPress={onExportTelemetry}>{t("saveTelemetry")}</Button>
              <Button onPress={() => pixelDispatcher.dispatch("calibrate")}>
                {t("calibrate")}
              </Button>
            </>
          )}
        </FastVStack>
        <FastVStack gap={4}>
          {status === "ready" && (
            <>
              <Button onPress={() => pixelDispatcher.dispatch("turnOff")}>
                {t("turnOff")}
              </Button>
              <Button onPress={() => pixelDispatcher.dispatch("discharge", 0)}>
                {t("stopDischarge")}
              </Button>
              <Button
                onPress={() =>
                  pixelDispatcher.dispatch("enableCharging", false)
                }
              >
                {t("disableCharging")}
              </Button>
              <Button onPress={() => pixelDispatcher.dispatch("blinkId")}>
                {t("blinkId")}
              </Button>
              <Button
                onPress={() =>
                  pixelDispatcher.dispatch(
                    "playAnimation",
                    PrebuildAnimations.rainbowAllFaces
                  )
                }
              >
                {t("rainbowAllFaces")}
              </Button>
              <Button onPress={onShowTelemetry}>{t("telemetryGraph")}</Button>
              <Button onPress={() => pixelDispatcher.dispatch("uploadProfile")}>
                {t("setDefaultProfile")}
              </Button>
              <Button
                onPress={() => pixelDispatcher.dispatch("exitValidation")}
              >
                {t("exitValidationMode")}
              </Button>
            </>
          )}
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

  // Values for UI
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

function ProfileUpdateModal({ updateProgress }: { updateProgress?: number }) {
  // Values for UI
  const modalStyle = useModalStyle();
  const { t } = useTranslation();
  return (
    <Portal>
      <Modal
        visible={updateProgress !== undefined}
        contentContainerStyle={modalStyle}
        dismissable={false}
      >
        <Text style={gs.mv3} variant="bodyLarge">
          {t("updatingProfile") + t("colonSeparator")}
        </Text>
        <ProgressBar percent={updateProgress ?? 0} />
      </Modal>
    </Portal>
  );
}

function ErrorCard({ error, clear }: { error: Error; clear: () => void }) {
  // Values for UI
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
  goBack,
}: {
  pixelDispatcher: PixelDispatcher;
  goBack: () => void;
}) {
  // Error handling
  const [lastError, setLastError] = React.useState<Error>();
  const clearError = React.useCallback(() => setLastError(undefined), []);

  // Pixel
  const pixel = pixelDispatcher.pixel;
  const status = usePixelStatus(pixel);

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

  // Telemetry
  const telemetryRef = React.useRef<TelemetryInfoHandle>(null);
  const telemetryStartTime = React.useRef(0);
  const telemetrySessionRef = React.useRef([] as TelemetryData[]);
  const onTelemetryData = React.useCallback((data: Telemetry) => {
    const now = Date.now();
    if (!telemetryStartTime.current) {
      telemetryStartTime.current = now;
    }
    telemetrySessionRef.current.push({
      timestamp: now - telemetryStartTime.current,
      rssi: data.rssi,
      battery: data.batteryLevelPercent,
      voltage: data.voltageTimes50 / 50,
    });
  }, []);
  const onExportTelemetry = React.useCallback(
    () =>
      exportCsv(`${pixel.name} Telemetry `, telemetrySessionRef.current).catch(
        setLastError
      ),
    [pixel.name]
  );

  // Values for UI
  const simpleStatus = React.useMemo(() => {
    // Returns simplified status
    switch (status) {
      case "connecting":
      case "identifying":
        return "connecting";
      case "ready":
        return "connected";
      case "disconnecting":
      default:
        return "disconnected";
    }
  }, [status]);
  const { t } = useTranslation();
  const TextEntry = useTextEntry(t("colonSeparator"));
  const theme = useTheme();
  return (
    <>
      <Card>
        <Card.Content>
          <FastVStack alignItems="center">
            <Text variant="headlineMedium">{pixelDispatcher.name}</Text>
            <TextEntry title={t("status")}>{t(simpleStatus)}</TextEntry>
          </FastVStack>
          <PaperButton style={{ position: "absolute" }} onPress={goBack}>
            <Ionicons
              name="arrow-back-outline"
              size={24}
              color={theme.colors.onBackground}
            />
          </PaperButton>
        </Card.Content>
      </Card>
      <View style={gs.mv3} />
      <Card>
        <Card.Content>
          <BaseInfo pixel={pixel} />
          <TelemetryInfo
            ref={telemetryRef}
            pixel={pixel}
            onData={onTelemetryData}
          />
        </Card.Content>
      </Card>
      <View style={gs.mv3} />
      <ScrollView>
        <Card>
          <Card.Content>
            {lastError ? (
              <ErrorCard error={lastError} clear={clearError} />
            ) : (
              <BottomButtons
                pixelDispatcher={pixelDispatcher}
                onShowTelemetry={telemetryRef.current?.showGraph}
                onExportTelemetry={onExportTelemetry}
              />
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <ProfileUpdateModal updateProgress={uploadProgress} />
    </>
  );
}
