import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import {
  assertNever,
  getValueKeyName,
} from "@systemic-games/pixels-core-utils";
import {
  FastHStack,
  FastVStack,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import {
  Pixel,
  PixelBatteryControllerStateValues,
  PixelBatteryStateValues,
  PixelRollStateValues,
  usePixelStatus,
  usePixelValue,
} from "@systemic-games/react-native-pixels-connect";
import * as FileSystem from "expo-file-system";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Platform, ScrollView, useWindowDimensions, View } from "react-native";
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
  Title,
} from "react-native-paper";

import {
  DynamicLinesChart,
  DynamicLinesChartHandle,
  DynamicLinesChartProps,
} from "./DynamicLinesChart";

import { ProgressBar } from "~/components/ProgressBar";
import { exportCsv } from "~/features/files/exportCsv";
import { getDatedFilename } from "~/features/files/getDatedFilename";
import { requestUserFileAsync } from "~/features/files/requestUserFileAsync";
import { useAppBackgroundState } from "~/features/hooks/useAppBackgroundState";
import { printLabelAsync } from "~/features/labels/printLabelAsync";
import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import { PrebuildAnimations } from "~/features/pixels/PrebuildAnimations";
import { TelemetryData } from "~/features/pixels/TelemetryData";
import { range } from "~/features/range";
import { shareFileAsync } from "~/features/shareFileAsync";
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
      <TextEntry title={t("pixelId")}>
        {pixel.pixelId.toString(16)}
        {t("commaSeparator")}
        {pixel.ledCount} {t("leds")}
      </TextEntry>
      <TextEntry title={t("characteristics")}>
        {pixel.dieType === "unknown" ? t("unknownDieType") : t(pixel.dieType)}
        {pixel.colorway === "unknown"
          ? ""
          : t("commaSeparator") + t(pixel.colorway)}
      </TextEntry>
      <TextEntry title={t("firmware")}>
        {pixel.firmwareDate.toString()}
      </TextEntry>
    </>
  );
}

function TelemetryModal({
  pixelDispatcher: pd,
  startTime,
  onSetStartTime,
  linesInfo,
  ...props
}: {
  pixelDispatcher: PixelDispatcher;
  startTime: number;
  onSetStartTime?: (timestamp: number) => void;
  linesInfo: DynamicLinesChartProps["linesInfo"];
} & Omit<ModalProps, "children">) {
  const chartRef = React.useRef<DynamicLinesChartHandle>(null);
  const getValues = React.useCallback(
    ({ appTimestamp, rssi, battery, voltage }: TelemetryData) => ({
      x: Math.round((appTimestamp - startTime) / 1000),
      yValues: [rssi, battery, voltage],
    }),
    [startTime]
  );
  const [points, setPoints] = React.useState<DynamicLinesChartProps["points"]>(
    []
  );
  React.useEffect(() => {
    if (props.visible) {
      // Reset points
      const data = pd.telemetryData;
      const index = data.findIndex((t) => t.appTimestamp >= startTime);
      const step = Math.floor((data.length - index) / 400);
      setPoints(
        index < 0
          ? []
          : range(index, data.length, step).map((i) => getValues(data[i]))
      );
    }
  }, [getValues, pd.telemetryData, props.visible, startTime]);
  useEffect(() => {
    if (props.visible) {
      const listener = (data: Readonly<TelemetryData>) => {
        // Add new point
        const values = getValues(data);
        chartRef.current?.push(values.x, values.yValues);
      };
      pd.addEventListener("telemetry", listener);
      return () => {
        pd.removeEventListener("telemetry", listener);
      };
    }
  }, [getValues, pd, props.visible]);

  // Values for UI
  const window = useWindowDimensions();
  const modalStyle = useModalStyle();
  const { t } = useTranslation();
  return (
    <Portal>
      <Modal contentContainerStyle={modalStyle} {...props}>
        <Text style={[gs.mv3, gs.textCentered]} variant="titleLarge">
          {t("telemetryGraph")}
        </Text>
        <DynamicLinesChart
          ref={chartRef}
          style={{
            width: "100%",
            height: window.width,
            marginTop: 10,
            backgroundColor: "gainsboro",
          }}
          points={points}
          linesInfo={linesInfo}
          textColor="steelblue"
          fontSize={12}
          title="Time in seconds"
          strokeWidth={1.5}
        />
        {onSetStartTime && (
          <FastHStack w="100%" justifyContent="flex-end" p={10} gap={10}>
            <PaperButton
              mode="contained-tonal"
              onPress={() => onSetStartTime(-1)}
            >
              {t("full")}
            </PaperButton>
            <PaperButton
              mode="contained-tonal"
              onPress={() => onSetStartTime(Date.now())}
            >
              {t("reset")}
            </PaperButton>
          </FastHStack>
        )}
      </Modal>
    </Portal>
  );
}

const TelemetryLinesInfo = [
  {
    title: "RSSI",
    color: "tomato",
    min: -100,
    max: 0,
  },
  {
    title: "Battery",
    color: "teal",
    min: 0,
    max: 100,
  },
  {
    title: "Voltage (mV)",
    color: "mediumpurple",
    min: 0,
    max: 5000,
  },
] as const;

function TelemetryInfo({ pixel }: { pixel: Pixel }) {
  const [telemetry, dispatch] = usePixelValue(pixel, "telemetry", {
    minInterval: 200, // Fast updates
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

  // Values for UI
  const { t } = useTranslation();
  const TextEntry = useTextEntry(t("colonSeparator"));
  const x = (telemetry?.accXTimes1000 ?? 0) / 1000;
  const y = (telemetry?.accYTimes1000 ?? 0) / 1000;
  const z = (telemetry?.accZTimes1000 ?? 0) / 1000;
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
            {t("commaSeparator")}
            {t("coil") + t("colonSeparator")}
            {t("voltageWithValue", {
              value: telemetry ? telemetry.vCoilTimes50 / 50 : 0,
            })}
          </TextEntry>
          <TextEntry title={t("chargingState")}>
            {t(
              getValueKeyName(
                telemetry?.batteryState,
                PixelBatteryStateValues
              ) ?? "unknown"
            )}
          </TextEntry>
          <TextEntry title={t("batteryControllerState")}>
            {getValueKeyName(
              telemetry?.batteryControllerState,
              PixelBatteryControllerStateValues
            ) ?? "unknown"}
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
          <TextEntry title={t("rssi")}>
            {t("dBmWithValue", { value: telemetry?.rssi ?? 0 })}
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
    </>
  );
}

function BottomButtons({
  pixelDispatcher: pd,
  onShowTelemetry,
  onExportTelemetry,
  onExportMessages,
}: {
  pixelDispatcher: PixelDispatcher;
  onShowTelemetry?: () => void;
  onExportTelemetry?: () => void;
  onExportMessages?: () => void;
}) {
  const status = usePixelStatus(pd.pixel);
  const connectStr = status === "disconnected" ? "connect" : "disconnect";
  const [printStatus, setPrintStatus] = React.useState("");
  const {
    isOpen: isPrinting,
    onOpen: onOpenPrint,
    onClose: onClosePrint,
  } = useDisclose();
  // Discharge modal
  const { isOpen, onOpen, onClose } = useDisclose();
  const { t } = useTranslation();

  return (
    <>
      <FastHStack gap={6}>
        <FastVStack gap={4}>
          <Button onPress={() => pd.dispatch(connectStr)}>
            {t(connectStr)}
          </Button>
          {status === "ready" && (
            <>
              <Button onPress={onOpen}>{t("discharge")}</Button>
              <Button onPress={() => pd.dispatch("enableCharging")}>
                {t("enableCharging")}
              </Button>
              <Button onPress={() => pd.dispatch("blink")}>{t("blink")}</Button>
              <Button
                onPress={() =>
                  pd.dispatch("playAnimation", PrebuildAnimations.rainbow)
                }
              >
                {t("rainbow")}
              </Button>
              <Button
                onPress={() =>
                  pd.dispatch("playAnimation", PrebuildAnimations.fixedRainbow)
                }
              >
                {t("fixedRainbow")}
              </Button>
              <Button onPress={onExportTelemetry}>{t("saveTelemetry")}</Button>
              <Button onPress={() => pd.dispatch("calibrate")}>
                {t("calibrate")}
              </Button>
              <Button onPress={() => pd.dispatch("reprogramDefaultBehavior")}>
                {t("setMinimalProfile")}
              </Button>
              <Button onPress={() => pd.dispatch("resetAllSettings")}>
                {t("resetAllSettings")}
              </Button>
              <Button onPress={() => pd.dispatch("rename")}>
                {t("rename")}
              </Button>
            </>
          )}
          <Button
            onPress={() => {
              setPrintStatus("");
              onOpenPrint();
              printLabelAsync(pd.pixel, (status) => {
                switch (status) {
                  case "preparing":
                    setPrintStatus("Preparing label...");
                    break;
                  case "sending":
                    setPrintStatus("Sending label to printer...");
                    break;
                  case "done":
                    setPrintStatus("Printing successful!");
                    break;
                  default:
                    assertNever(status, "Unsupported print status");
                }
              }).catch((error) => {
                const msg = error.message ?? error;
                console.warn(msg);
                setPrintStatus(msg);
              });
            }}
          >
            {t("printLabel")}
          </Button>
        </FastVStack>
        <FastVStack gap={4}>
          {status === "ready" && (
            <>
              <Button onPress={() => pd.dispatch("turnOff")}>
                {t("turnOff")}
              </Button>
              <Button onPress={() => pd.dispatch("discharge", 0)}>
                {t("stopDischarge")}
              </Button>
              <Button onPress={() => pd.dispatch("enableCharging", false)}>
                {t("disableCharging")}
              </Button>
              <Button onPress={() => pd.dispatch("blinkId")}>
                {t("blinkId")}
              </Button>
              <Button
                onPress={() =>
                  pd.dispatch(
                    "playAnimation",
                    PrebuildAnimations.rainbowAllFaces
                  )
                }
              >
                {t("rainbowAllFaces")}
              </Button>
              <Button onPress={onShowTelemetry}>{t("telemetryGraph")}</Button>
              <Button onPress={() => pd.dispatch("exitValidation")}>
                {t("exitValidationMode")}
              </Button>
              <Button onPress={() => pd.dispatch("uploadProfile")}>
                {t("setUserProfile")}
              </Button>
              <Button
                onPress={() => pd.dispatch("uploadProfile", "fixedRainbow")}
              >
                {t("setFixedRainbowProfile")}
              </Button>
              <Button
                onPress={() => pd.dispatch("uploadProfile", "fixedRainbowD4")}
              >
                {t("setFixedRainbowProfileD4")}
              </Button>
              <Button onPress={() => pd.dispatch("playProfileAnimation", 0)}>
                {t("playProfileAnim")}
              </Button>
            </>
          )}
          <Button onPress={onExportMessages}>{t("exportLog")}</Button>
        </FastVStack>
      </FastHStack>

      <DischargeModal
        pixelDispatcher={pd}
        visible={isOpen}
        onDismiss={onClose}
      />

      <PrintModal
        status={printStatus}
        visible={isPrinting}
        onDismiss={onClosePrint}
      />
    </>
  );
}

function DischargeModal({
  pixelDispatcher: pd,
  ...props
}: {
  pixelDispatcher: PixelDispatcher;
} & Omit<ModalProps, "children">) {
  // Discharge current in mA
  const [current, setCurrent] = React.useState(50);
  React.useEffect(() => {
    if (props.visible) {
      pd.dispatch("discharge", props.visible && current);
    }
  }, [current, pd, props.visible]);

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
              pd.dispatch("discharge", 0);
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

function PrintModal({
  status,
  ...props
}: { status: string } & Omit<ModalProps, "children">) {
  const showClose = status.length > 0 && !status.endsWith("...");
  // Values for UI
  const modalStyle = useModalStyle();
  const { t } = useTranslation();
  return (
    <Portal>
      <Modal contentContainerStyle={modalStyle} dismissable={false} {...props}>
        <FastVStack gap={10}>
          <Title>{t("labelPrinting")}</Title>
          <Divider style={{ height: 2 }} />
          <Text style={gs.centered} variant="bodyLarge">
            {}
          </Text>
          <Text>
            {t("status")}
            {t("colonSeparator")}
            {status}
          </Text>
          {showClose && <Button onPress={props.onDismiss}>{t("close")}</Button>}
        </FastVStack>
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
  pixelDispatcher: pd,
  goBack,
}: {
  pixelDispatcher: PixelDispatcher;
  goBack: () => void;
}) {
  // Error handling
  const [lastError, setLastError] = React.useState<Error>();
  const clearError = React.useCallback(() => setLastError(undefined), []);

  // Pixel
  const pixel = pd.pixel;
  const status = usePixelStatus(pixel);
  const [name] = usePixelValue(pixel, "name");

  // Connect on mount
  React.useEffect(() => {
    // TODO it shouldn't be necessary to do this check
    if (pd.pixel.status === "disconnected") {
      pd.pixel.connect().catch(setLastError);
    }
  }, [pd]);

  // Profile upload
  const [uploadProgress, setUploadProgress] = React.useState<number>();
  React.useEffect(() => {
    pd.addEventListener("error", setLastError);
    pd.addEventListener("profileUploadProgress", setUploadProgress);
    return () => {
      pd.removeEventListener("error", setLastError);
      pd.removeEventListener("profileUploadProgress", setUploadProgress);
    };
  }, [pd]);

  // Telemetry Graph
  const [startTime, setStartTime] = React.useState(
    pd.telemetryData[0]?.appTimestamp ?? Date.now()
  );
  const changeStartTime = React.useCallback(
    (t: number) =>
      setStartTime(
        t >= 0 ? t : pd.telemetryData[0]?.appTimestamp ?? Date.now()
      ),
    [pd]
  );
  const { isOpen, onOpen, onClose } = useDisclose();

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
            <Text variant="headlineMedium">{name ?? pd.name}</Text>
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
          <TelemetryInfo pixel={pixel} />
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
                pixelDispatcher={pd}
                onShowTelemetry={onOpen}
                onExportTelemetry={() => {
                  const filename =
                    getDatedFilename([pd.name, "telemetry"]) + ".csv";
                  exportCsv(filename, pd.telemetryData).catch(setLastError);
                }}
                onExportMessages={() => {
                  const filename =
                    getDatedFilename([pd.name, "messages"]) + ".json";
                  const saveFile = async () => {
                    // The boolean below is always false to test file sharing on Android
                    const isAndroid = false && Platform.OS === "android";
                    const uri = isAndroid
                      ? await requestUserFileAsync(filename)
                      : FileSystem.cacheDirectory + filename;
                    try {
                      await pd.exportMessages(uri);
                      if (!isAndroid) {
                        await shareFileAsync(uri);
                      }
                    } finally {
                      if (!isAndroid) {
                        await FileSystem.deleteAsync(uri, { idempotent: true });
                      }
                    }
                  };
                  saveFile().catch(setLastError);
                }}
              />
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <ProfileUpdateModal updateProgress={uploadProgress} />

      <TelemetryModal
        pixelDispatcher={pd}
        linesInfo={TelemetryLinesInfo}
        startTime={startTime}
        onSetStartTime={changeStartTime}
        visible={isOpen}
        onDismiss={onClose}
      />
    </>
  );
}
