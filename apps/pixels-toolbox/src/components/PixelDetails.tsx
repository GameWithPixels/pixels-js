import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import {
  getValueKeyName,
  range,
  unsigned32ToHex,
} from "@systemic-games/pixels-core-utils";
import {
  EditAnimationKeyframed,
  PrebuildAnimations,
  PrebuildAnimationsExt,
  PrebuildProfilesNames,
} from "@systemic-games/pixels-edit-animation";
import {
  BaseHStack,
  BaseVStack,
  useVisibility,
} from "@systemic-games/react-native-base-components";
import {
  DiceUtils,
  Pixel,
  PixelBatteryControllerMode,
  PixelBatteryControllerModeValues,
  PixelBatteryControllerStateValues,
  PixelBatteryStateValues,
  PixelColorway,
  PixelColorwayValues,
  PixelDieType,
  PixelDieTypeValues,
  PixelInfoNotifier,
  PixelRollStateValues,
  useForceUpdate,
  usePixelEvent,
  usePixelProp,
  usePixelStatus,
} from "@systemic-games/react-native-pixels-connect";
import * as FileSystem from "expo-file-system";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Platform, ScrollView, useWindowDimensions, View } from "react-native";
import {
  ButtonProps,
  Card,
  Divider,
  Menu,
  Modal,
  ModalProps,
  Button as PaperButton,
  Portal,
  Switch,
  Text,
  useTheme,
} from "react-native-paper";

import {
  DynamicLinesChart,
  DynamicLinesChartHandle,
  DynamicLinesChartProps,
} from "./DynamicLinesChart";

import { AppStyles, useModalStyle } from "~/AppStyles";
import { ProgressBar } from "~/components/ProgressBar";
import { PatternImages } from "~/features/PatternImages";
import { createPatternFromImage } from "~/features/createPatternFromImage";
import { exportCsv } from "~/features/files/exportCsv";
import { getDatedFilename } from "~/features/files/getDatedFilename";
import { requestUserFileAsync } from "~/features/files/requestUserFileAsync";
import ChargerDispatcher from "~/features/pixels/ChargerDispatcher";
import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import { TelemetryData } from "~/features/pixels/TelemetryData";
import { shareFileAsync } from "~/features/shareFileAsync";
import { useAppBackgroundState } from "~/hooks/useAppBackgroundState";
import { capitalize } from "~/i18n";

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
      <Text style={AppStyles.bold}>
        {capitalize(title)}
        {colonSeparator}
      </Text>
      <Text style={AppStyles.italic}>{children}</Text>
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

function BaseInfo({ pixel }: { pixel: PixelInfoNotifier }) {
  const forceUpdate = useForceUpdate();
  React.useEffect(() => {
    const listener = () => forceUpdate();
    pixel.addPropertyListener("dieType", listener);
    pixel.addPropertyListener("colorway", listener);
    pixel.addPropertyListener("firmwareDate", listener);
    return () => {
      pixel.removePropertyListener("dieType", listener);
      pixel.removePropertyListener("colorway", listener);
      pixel.removePropertyListener("firmwareDate", listener);
    };
  }, [pixel, forceUpdate]);
  const { t } = useTranslation();
  const TextEntry = useTextEntry(t("colonSeparator"));
  return (
    <>
      <TextEntry title={t("pixelId")}>
        {unsigned32ToHex(pixel.pixelId)}
        {t("commaSeparator")}
      </TextEntry>
      <TextEntry title={t("descriptionShort")}>
        {pixel.dieType === "unknown" ? t("unknownDieType") : t(pixel.dieType)}
        {t("commaSeparator")}
        {pixel.colorway === "unknown"
          ? t("unknownColorway")
          : t(pixel.colorway)}
        {t("commaSeparator")}
        {pixel.ledCount} {t("leds")}
      </TextEntry>
      <TextEntry title={t("firmware")}>
        {pixel.firmwareDate.toLocaleDateString()}
        {t("commaSeparator")}
        {pixel.firmwareDate.toLocaleTimeString()}
      </TextEntry>
    </>
  );
}

function ChargerInfo({ charger }: { charger: PixelInfoNotifier }) {
  const forceUpdate = useForceUpdate();
  React.useEffect(() => {
    const listener = () => forceUpdate();
    charger.addPropertyListener("firmwareDate", listener);
    return () => {
      charger.removePropertyListener("firmwareDate", listener);
    };
  }, [charger, forceUpdate]);
  const { t } = useTranslation();
  const TextEntry = useTextEntry(t("colonSeparator"));
  return (
    <>
      <TextEntry title={t("charger")}>{t("yes")}</TextEntry>
      <TextEntry title={t("pixelId")}>
        {unsigned32ToHex(charger.pixelId)}
      </TextEntry>
      <TextEntry title={t("descriptionShort")}>
        {charger.ledCount} {t("leds")}
      </TextEntry>
      <TextEntry title={t("firmware")}>
        {charger.firmwareDate.toLocaleDateString()}
        {t("commaSeparator")}
        {charger.firmwareDate.toLocaleTimeString()}
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
        <Text
          style={[AppStyles.mv3, AppStyles.textCentered]}
          variant="titleLarge"
        >
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
          <BaseHStack w="100%" justifyContent="flex-end" p={10} gap={10}>
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
          </BaseHStack>
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
  const [telemetry, dispatch] = usePixelEvent(pixel, "telemetry", {
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
            {capitalize(
              getValueKeyName(
                telemetry?.batteryControllerState,
                PixelBatteryControllerStateValues
              ) ?? "unknown"
            )}
          </TextEntry>
          <TextEntry title={t("batteryControllerMode")}>
            {t(
              getValueKeyName(
                telemetry?.batteryControllerMode,
                PixelBatteryControllerModeValues
              ) ?? "unknown"
            )}
          </TextEntry>
          <TextEntry title={t("internalChargerState")}>
            {t(telemetry?.internalChargeState ? "chargerOn" : "chargerOff")}
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
            {telemetry
              ? `${t(
                  getValueKeyName(telemetry?.rollState, PixelRollStateValues) ??
                    "unknown"
                )}, ${DiceUtils.faceFromIndex(
                  telemetry.faceIndex,
                  pixel.dieType
                )} (index: ${telemetry.faceIndex})`
              : "unknown"}
          </TextEntry>
          <TextEntry title={t("accelerometer")}>{acc}</TextEntry>
        </>
      )}
      <Divider style={{ height: 3, marginVertical: 5 }} />
      <BaseHStack w="100%" alignContent="space-around">
        <Text style={[AppStyles.flex, AppStyles.bold]} variant="bodyLarge">
          {t("enableTelemetry")}
        </Text>
        <Switch onValueChange={setTelemetryOn} value={telemetryOn} />
      </BaseHStack>
    </>
  );
}

async function playKeyframes(pixelDispatcher: PixelDispatcher) {
  const pattern = await createPatternFromImage(PatternImages.acceleration);
  const keyframesCount = pattern.gradients.map((g) => g.keyframes.length);
  console.log(
    `Extracted ${keyframesCount.reduce(
      (a, b) => a + b,
      0
    )} keyframes: ${keyframesCount.join(", ")}`
  );
  const anim = new EditAnimationKeyframed({
    duration: 3,
    pattern,
  });
  pixelDispatcher.dispatch("playAnimation", anim);
}

function BottomButtons({
  pixelDispatcher: pd,
  onShowTelemetry,
  onExportTelemetry,
  onExportMessages,
  onPrintLabel,
}: {
  pixelDispatcher: PixelDispatcher;
  onShowTelemetry?: () => void;
  onExportTelemetry?: () => void;
  onExportMessages?: () => void;
  onPrintLabel?: () => void;
}) {
  const status = usePixelStatus(pd.pixel);
  const connectStr = status === "disconnected" ? "connect" : "disconnect";
  const isCharger = pd instanceof ChargerDispatcher; // TODO until we have a better support for chargers

  // Charger mode modal
  const {
    visible: chargerModeMenuVisible,
    show: showChargerModeMenu,
    hide: hideChargerModeMenu,
  } = useVisibility();

  // Discharge modal
  const {
    visible: dischargeVisible,
    show: showDischarge,
    hide: hideDischarge,
  } = useVisibility();

  const {
    visible: uploadProfileMenuVisible,
    show: showUploadProfileMenu,
    hide: hideUploadProfileMenu,
  } = useVisibility();

  const {
    visible: playAnimMenuVisible,
    show: showPlayAnimMenu,
    hide: hidePlayAnimMenu,
  } = useVisibility();

  const {
    visible: setDieTypeMenuVisible,
    show: showSetDieTypeMenu,
    hide: hideSetDieTypeMenu,
  } = useVisibility();

  const {
    visible: setDieColorwayMenuVisible,
    show: showSetDieColorwayMenu,
    hide: hideSetDieColorwayMenu,
  } = useVisibility();

  const { t } = useTranslation();
  return (
    <>
      <BaseHStack gap={6}>
        <BaseVStack gap={4}>
          <Button onPress={() => pd.dispatch(connectStr)}>
            {t(connectStr)}
          </Button>
          {status === "ready" && !isCharger && (
            <>
              <Button onPress={showDischarge}>{t("discharge")}</Button>
              <Button onPress={() => pd.dispatch("blinkId")}>
                {t("blinkId")}
              </Button>
              <Menu
                visible={uploadProfileMenuVisible}
                onDismiss={hideUploadProfileMenu}
                anchorPosition="top"
                anchor={
                  <Button onPress={showUploadProfileMenu}>
                    {t("setProfile")}
                  </Button>
                }
              >
                {PrebuildProfilesNames.map((profile) => (
                  <Menu.Item
                    key={profile}
                    title={profile}
                    onPress={() => {
                      pd.dispatch("uploadProfile", profile);
                      hideUploadProfileMenu();
                    }}
                  />
                ))}
              </Menu>
              <Menu
                visible={playAnimMenuVisible}
                onDismiss={hidePlayAnimMenu}
                anchorPosition="top"
                anchor={
                  <Button onPress={showPlayAnimMenu}>
                    {t("playAnimation")}
                  </Button>
                }
              >
                {Object.entries(PrebuildAnimationsExt).map(
                  ([animName, anim]) => (
                    <Menu.Item
                      key={animName}
                      title={animName}
                      onPress={() => {
                        pd.dispatch("playAnimation", anim);
                      }}
                    />
                  )
                )}
                {Object.entries(PrebuildAnimations).map(([animName, anim]) => (
                  <Menu.Item
                    key={animName}
                    title={animName}
                    onPress={() => {
                      pd.dispatch("playAnimation", anim);
                    }}
                  />
                ))}
              </Menu>
              <Menu
                visible={setDieTypeMenuVisible}
                onDismiss={hideSetDieTypeMenu}
                anchorPosition="top"
                anchor={
                  <Button onPress={showSetDieTypeMenu}>
                    {t("setDieType")}
                  </Button>
                }
              >
                {(Object.keys(PixelDieTypeValues) as PixelDieType[])
                  .filter((dt) => dt !== "unknown")
                  .map((dieType) => (
                    <Menu.Item
                      key={dieType}
                      title={dieType}
                      onPress={() => {
                        pd.dispatch("setDieType", dieType);
                        hideSetDieTypeMenu();
                      }}
                    />
                  ))}
              </Menu>
              <Menu
                visible={setDieColorwayMenuVisible}
                onDismiss={hideSetDieColorwayMenu}
                anchorPosition="top"
                anchor={
                  <Button onPress={showSetDieColorwayMenu}>
                    {t("setDieColorway")}
                  </Button>
                }
              >
                {(Object.keys(PixelColorwayValues) as PixelColorway[])
                  .filter((dt) => dt !== "unknown")
                  .map((colorway) => (
                    <Menu.Item
                      key={colorway}
                      title={colorway}
                      onPress={() => {
                        pd.dispatch("setColorway", colorway);
                        hideSetDieColorwayMenu();
                      }}
                    />
                  ))}
              </Menu>
              <Button
                onPress={() =>
                  playKeyframes(pd).catch((error) =>
                    console.log("Error loading gradient", error)
                  )
                }
              >
                {t("playKeyframes")}
              </Button>
              <Button onPress={onShowTelemetry}>{t("telemetryGraph")}</Button>
            </>
          )}
          {!isCharger && (
            <Button onPress={onPrintLabel}>{t("printLabel")}</Button>
          )}
        </BaseVStack>
        <BaseVStack gap={4}>
          {status === "ready" && !isCharger && (
            <>
              <Button onPress={() => pd.dispatch("turnOff")}>
                {t("turnOff")}
              </Button>
              <Menu
                visible={chargerModeMenuVisible}
                onDismiss={hideChargerModeMenu}
                anchorPosition="top"
                anchor={
                  <Button onPress={showChargerModeMenu}>
                    {t("setChargerMode")}
                  </Button>
                }
              >
                {Object.keys(PixelBatteryControllerModeValues).map((mode) => (
                  <Menu.Item
                    key={mode}
                    title={t(mode)}
                    onPress={() => {
                      pd.dispatch(
                        "setChargerMode",
                        mode as PixelBatteryControllerMode
                      );
                      hideChargerModeMenu();
                    }}
                  />
                ))}
              </Menu>
              <Button onPress={() => pd.dispatch("blink")}>{t("blink")}</Button>
              <Button onPress={() => pd.dispatch("calibrate")}>
                {t("calibrate")}
              </Button>
              <Button onPress={onExportTelemetry}>{t("saveTelemetry")}</Button>
              <Button onPress={() => pd.dispatch("exitValidation")}>
                {t("exitValidationMode")}
              </Button>
              <Button onPress={() => pd.dispatch("rename")}>
                {t("rename")}
              </Button>
              <Button onPress={() => pd.dispatch("resetAllSettings")}>
                {t("resetAllSettings")}
              </Button>
            </>
          )}
          <Button onPress={onExportMessages}>{t("exportLogs")}</Button>
        </BaseVStack>
      </BaseHStack>

      <DischargeModal
        pixelDispatcher={pd}
        visible={dischargeVisible}
        onDismiss={hideDischarge}
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
        <Text style={AppStyles.mv3} variant="bodyLarge">
          {t("dischargeCurrentWithValue", { current })}
        </Text>
        <Slider
          value={current}
          minimumValue={10}
          maximumValue={160}
          step={10}
          onValueChange={setCurrent}
        />
        <BaseHStack pt={20} justifyContent="space-around">
          <Button
            onPress={() => {
              pd.dispatch("discharge", 0);
              props.onDismiss?.();
            }}
          >
            {t("stopDischarge")}
          </Button>
          <Button onPress={props.onDismiss}>{t("ok")}</Button>
        </BaseHStack>
      </Modal>
    </Portal>
  );
}

function ProfileUpdateModal({
  updateProgress,
  ...props
}: { updateProgress?: number } & Omit<ModalProps, "children" | "visible">) {
  // Values for UI
  const modalStyle = useModalStyle();
  const { t } = useTranslation();
  return (
    <Portal>
      <Modal
        visible={updateProgress !== undefined}
        contentContainerStyle={modalStyle}
        dismissable={false}
        {...props}
      >
        <Text style={AppStyles.mv3} variant="bodyLarge">
          {t("updatingProfile") + t("colonSeparator")}
        </Text>
        <ProgressBar percent={updateProgress ?? 0} />
      </Modal>
    </Portal>
  );
}

function ErrorCard({ error, clear }: { error: Error; clear: () => void }) {
  // Values for UI
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <>
      <Text
        style={{
          color: colors.error,
          fontWeight: "bold",
          padding: 10,
          borderColor: colors.errorContainer,
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
  onPrintLabel,
  goBack,
}: {
  pixelDispatcher: PixelDispatcher;
  onPrintLabel?: (pixelDispatcher: PixelDispatcher) => void;
  goBack: () => void;
}) {
  // Error handling
  const [lastError, setLastError] = React.useState<Error>();
  const clearError = React.useCallback(() => setLastError(undefined), []);

  // Pixel
  const pixel = pd.pixel;
  const status = usePixelStatus(pixel);
  const name = usePixelProp(pixel, "name");

  // Connect on mount
  React.useEffect(() => {
    pixel.connect().catch(setLastError);
  }, [pixel]);

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
  const {
    visible: telemetryVisible,
    show: showTelemetry,
    hide: hideTelemetry,
  } = useVisibility();

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
  const { colors } = useTheme();
  return (
    <>
      <Card>
        <Card.Content>
          <BaseVStack alignItems="center">
            <Text variant="headlineMedium">{name ?? pd.name}</Text>
            <TextEntry title={t("status")}>{t(simpleStatus)}</TextEntry>
          </BaseVStack>
          <PaperButton style={{ position: "absolute" }} onPress={goBack}>
            <Ionicons
              name="arrow-back-outline"
              size={24}
              color={colors.onBackground}
            />
          </PaperButton>
        </Card.Content>
      </Card>
      <View style={AppStyles.mv3} />
      <Card>
        <Card.Content>
          {pd.type === "pixel" ? (
            <>
              <BaseInfo pixel={pd} />
              <TelemetryInfo pixel={pixel} />
            </>
          ) : (
            <ChargerInfo charger={pd} />
          )}
        </Card.Content>
      </Card>
      <View style={AppStyles.mv3} />
      <ScrollView>
        <Card>
          <Card.Content>
            {lastError ? (
              <ErrorCard error={lastError} clear={clearError} />
            ) : (
              <BottomButtons
                pixelDispatcher={pd}
                onShowTelemetry={showTelemetry}
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
                        await FileSystem.deleteAsync(uri, {
                          idempotent: true,
                        });
                      }
                    }
                  };
                  saveFile().catch(setLastError);
                }}
                onPrintLabel={() => onPrintLabel?.(pd)}
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
        visible={telemetryVisible}
        onDismiss={hideTelemetry}
      />
    </>
  );
}
