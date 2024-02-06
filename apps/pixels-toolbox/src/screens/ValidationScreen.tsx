import { useFocusEffect } from "@react-navigation/native";
import { range } from "@systemic-games/pixels-core-utils";
import {
  BaseBox,
  BaseVStack,
  getBorderRadius,
} from "@systemic-games/react-native-base-components";
import {
  DiceUtils,
  Pixel,
  PixelDieType,
  ScannedPixel,
} from "@systemic-games/react-native-pixels-connect";
import { useKeepAwake } from "expo-keep-awake";
import React from "react";
import { useErrorHandler } from "react-error-boundary";
import { useTranslation, type TFunction } from "react-i18next";
import { ScrollView, TextStyle, View } from "react-native";
import {
  Banner,
  Button,
  ButtonProps,
  Card,
  Text,
  TouchableRipple,
  TouchableRippleProps,
  useTheme,
} from "react-native-paper";
import {
  Camera,
  CameraPermissionStatus,
  FrameProcessorPerformanceSuggestion,
  useCameraDevices,
} from "react-native-vision-camera";

import { AppStyles } from "~/AppStyles";
import { AppPage } from "~/components/AppPage";
import { ProgressBar } from "~/components/ProgressBar";
import { ScannedPixelsList } from "~/components/ScannedPixelsList";
import {
  CheckBoard,
  CheckLEDs,
  ConnectPixel,
  PrepareDie,
  ValidationTestsSettings,
  UpdateFirmware,
  WaitCharging,
  WaitDieInCase,
  WaitFaceUp,
  TurnOffDevice,
  StoreSettings,
  LabelPrinting,
  UpdateFirmwareStatus,
  getPixelThroughDispatcher,
  FactoryDfuFilesBundle,
} from "~/components/ValidationTestsComponents";
import { useFactoryDfuFilesBundle } from "~/features/hooks/useFactoryDfuFilesBundle";
import { usePixelIdDecoderFrameProcessor } from "~/features/hooks/usePixelIdDecoderFrameProcessor";
import { PrintStatus } from "~/features/print";
import {
  getTaskResult,
  getTaskResultEmoji,
  TaskResult,
} from "~/features/tasks/TaskResult";
import { useTaskChain } from "~/features/tasks/useTaskChain";
import { useTaskComponent } from "~/features/tasks/useTaskComponent";
import { toLocaleDateTimeString } from "~/features/toLocaleDateTimeString";
import {
  getBoardOrDie,
  isBoard,
  ValidationBoardTypes,
  ValidationDieTypes,
  ValidationSequence,
  ValidationSequences,
} from "~/features/validation";
import { capitalize } from "~/i18n";

function getTestingMessage(
  t: TFunction<"translation", undefined>,
  settings: Pick<ValidationTestsSettings, "dieType" | "sequence">
): string {
  return t("testingDieTypeWithSequence", {
    dieType: t(settings.dieType),
    sequence: t(settings.sequence),
  });
}

function BottomButton({ children, ...props }: Omit<ButtonProps, "style">) {
  return (
    <Button mode="outlined" style={{ ...AppStyles.fullWidth }} {...props}>
      {children}
    </Button>
  );
}

function LargeTonalButton({
  children,
  fontSize = 24,
  ...props
}: TouchableRippleProps & {
  fontSize?: TextStyle["fontSize"];
  children: React.ReactNode;
}) {
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness);
  // Paper's button doesn't have multiline text (by design) so we render our own custom button
  return (
    <TouchableRipple
      rippleColor={colors.surface}
      style={{
        flex: 1,
        backgroundColor: colors.secondaryContainer,
        padding: 10,
        borderRadius,
        alignContent: "center",
        justifyContent: "center",
      }}
      {...props}
    >
      <Text
        style={{
          fontSize,
          fontWeight: "bold",
          flexWrap: "wrap",
          textAlign: "center",
          color: props.disabled
            ? colors.onSurfaceDisabled
            : colors.onSecondaryContainer,
        }}
      >
        {children}
      </Text>
    </TouchableRipple>
  );
}

function SelectSequencePage({
  dfuFilesBundle,
  dfuFilesError,
  isFactoryDfuBundle,
  onSelectSequence,
}: {
  dfuFilesBundle?: FactoryDfuFilesBundle;
  dfuFilesError?: Error;
  isFactoryDfuBundle?: boolean;
  onSelectSequence: (sequence: ValidationSequence) => void;
}) {
  const fwDateLabel = React.useMemo(() => {
    if (dfuFilesBundle) {
      return toLocaleDateTimeString(dfuFilesBundle.date);
    }
  }, [dfuFilesBundle]);
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <BaseVStack
      w="100%"
      h="100%"
      px={5}
      py={20}
      gap={30}
      justifyContent="space-around"
    >
      {dfuFilesError ? (
        <BaseVStack padding={20} backgroundColor={colors.errorContainer}>
          <Text style={{ color: colors.onErrorContainer }}>
            {t("errorLoadingFirmwareFiles") +
              t("colonSeparator") +
              dfuFilesError.message}
          </Text>
        </BaseVStack>
      ) : dfuFilesBundle && !isFactoryDfuBundle ? (
        <Banner visible icon="alert-rhombus-outline" elevation={3}>
          {t("diceUpdatedWithCustomFirmwareWarning")}
          {"\n\n"}
          {t("selection")}
          {t("colonSeparator")}
          {dfuFilesBundle?.date
            ? toLocaleDateTimeString(dfuFilesBundle.date)
            : t("loadingFirmwareFiles")}
        </Banner>
      ) : (
        <BaseVStack alignItems="center" marginVertical={-10}>
          <Text variant="titleSmall">
            {dfuFilesBundle
              ? t("updateFirmwareIfOlderWithDate", { date: fwDateLabel })
              : t("loadingFirmwareFiles")}
          </Text>
        </BaseVStack>
      )}
      {ValidationSequences.map((s) => (
        <LargeTonalButton
          key={s}
          disabled={!!dfuFilesError || !dfuFilesBundle}
          onPress={() => onSelectSequence(s)}
        >
          {t(s === "firmwareUpdate" ? s : "validate" + capitalize(s))}
        </LargeTonalButton>
      ))}
    </BaseVStack>
  );
}

function SelectDieTypePage({
  sequence,
  onSelectDieType,
  onBack,
}: {
  sequence: ValidationSequence;
  onSelectDieType: (type: PixelDieType) => void;
  onBack?: () => void;
}) {
  const types = isBoard(sequence) ? ValidationBoardTypes : ValidationDieTypes;
  const items =
    types.length > 6
      ? range(types.length / 2).map((i) => [types[2 * i], types[2 * i + 1]]) // Breaks in 2 columns
      : types.map((t) => [t]);
  const { t } = useTranslation();
  return (
    <BaseVStack
      w="100%"
      h="100%"
      px={5}
      gap={20}
      justifyContent="space-around"
      paddingVertical={10}
    >
      <Text variant="headlineSmall" style={AppStyles.textCentered}>
        {t("testingSequence", { sequence: t(sequence) })}
      </Text>
      {items.map((items, i) => (
        <View key={i} style={{ flex: 1, flexDirection: "row", gap: 20 }}>
          {items.map((dt) =>
            dt ? (
              <LargeTonalButton key={dt} onPress={() => onSelectDieType(dt)}>
                {t(dt)}
              </LargeTonalButton>
            ) : (
              // Empty item
              <View key="empty" style={{ flex: 1 }} />
            )
          )}
        </View>
      ))}
      <BaseBox paddingHorizontal={10}>
        <BottomButton onPress={onBack}>{t("back")}</BottomButton>
      </BaseBox>
    </BaseVStack>
  );
}

type CameraStatus =
  | "initializing"
  | "needPermission"
  | "noParallelVideoProcessing"
  | "ready";

function DecodePixelIdPage({
  onDecodedPixelId,
  settings,
  onBack,
}: {
  onDecodedPixelId: (pixelId: number) => void;
  settings: Pick<ValidationTestsSettings, "dieType" | "sequence">;
  onBack?: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const errorHandler = useErrorHandler();

  // Camera
  const [cameraPermission, setCameraPermission] =
    React.useState<CameraPermissionStatus>();
  const devices = useCameraDevices("wide-angle-camera");
  const cameraRef = React.useRef<Camera>(null);

  // Camera permissions
  useFocusEffect(
    React.useCallback(() => {
      setCameraPermission(undefined); // Reset permission when re-showing screen
      console.log("Requesting camera permission");
      Camera.requestCameraPermission().then((perm) => {
        console.log(`Camera permission: ${perm}`);
        setCameraPermission(perm);
        return perm;
      });
    }, [])
  );

  // We use the back camera
  const device = devices.back;

  // Camera status
  const [cameraStatus, setCameraStatus] =
    React.useState<CameraStatus>("initializing");

  // Update camera status
  React.useEffect(() => {
    if (!cameraPermission) {
      setCameraStatus("initializing");
    } else if (cameraPermission === "denied") {
      setCameraStatus("needPermission");
      errorHandler(new Error(t("needCameraPermission")));
    } else if (cameraPermission === "authorized" && device) {
      setCameraStatus("ready");
    }
  }, [cameraPermission, device, errorHandler, t]);

  // Frame processor for decoding PixelId
  const [frameProcessor, decoderState, lastError] =
    usePixelIdDecoderFrameProcessor();

  // Log FPS suggestions for frame processor
  const onSuggestion = React.useCallback(
    (suggestion: FrameProcessorPerformanceSuggestion) =>
      console.log(
        `Frame processor suggestion: ${suggestion.type} ${suggestion.suggestedFrameProcessorFps}`
      ),
    []
  );
  // Notify when pixel id has been decoded
  React.useEffect(() => {
    if (decoderState.pixelId) {
      onDecodedPixelId(decoderState.pixelId);
    }
  }, [onDecodedPixelId, decoderState.pixelId]);

  // Monitor color changes
  const lastColorChangesRef = React.useRef<number[]>([]);
  const [readingColors, setReadingColors] = React.useState(false);
  React.useEffect(() => {
    const lastColorsChanges = lastColorChangesRef.current;
    if (decoderState.scanColor) {
      const now = Date.now();
      lastColorsChanges.push(now);
      if (lastColorsChanges.length >= 5) {
        lastColorsChanges.shift();
        const maxDelay = 1000;
        const readingColors = now - lastColorsChanges[0] < maxDelay;
        setReadingColors(readingColors);
        if (readingColors) {
          const timeoutId = setTimeout(() => {
            setReadingColors(false);
          }, maxDelay);
          return () => clearTimeout(timeoutId);
        }
      }
    }
  }, [decoderState.scanColor]);

  // Scan list
  const [showScanList, setShowScanList] = React.useState(false);

  const onSelect = React.useCallback(
    (sp: ScannedPixel) => onDecodedPixelId(sp.pixelId),
    [onDecodedPixelId]
  );
  const onClose = React.useCallback(() => setShowScanList(false), []);

  return showScanList ? (
    <BaseBox w="100%" h="100%">
      <ScannedPixelsList
        ledCount={DiceUtils.getLEDCount(settings.dieType)}
        onSelect={onSelect}
        onClose={onClose}
      />
    </BaseBox>
  ) : (
    <BaseVStack w="100%" h="100%" alignItems="center" justifyContent="center">
      {device && cameraStatus === "ready" ? (
        <Camera
          ref={cameraRef}
          style={{
            width: "100%",
            height: "100%",
          }}
          device={device}
          isActive
          hdr={false}
          lowLightBoost={false}
          videoStabilizationMode="off"
          frameProcessor={frameProcessor}
          fps={30}
          frameProcessorFps={30}
          onFrameProcessorPerformanceSuggestionAvailable={onSuggestion}
        />
      ) : (
        <Text variant="headlineSmall">{t("startingCamera")}</Text>
      )}
      {/* Show message on top */}
      <BaseBox position="absolute" top={0} w="100%" p={5}>
        <Card
          contentStyle={{
            ...AppStyles.centered,
            flexDirection: "row",
            padding: 10,
            gap: 10,
          }}
        >
          {!readingColors || lastError ? (
            <>
              {lastError ? (
                <Card.Content style={{ flex: 1 }}>
                  <Text
                    variant="bodyLarge"
                    style={{ flex: 1, color: colors.error }}
                  >{`${lastError}`}</Text>
                </Card.Content>
              ) : (
                <Text variant="bodyLarge" style={{ flex: 1 }}>
                  {t("resetUsingMagnetWithFormFactor", {
                    formFactor: t(getBoardOrDie(settings.sequence)),
                  })}
                </Text>
              )}
              <Button
                mode="contained-tonal"
                onPress={() => setShowScanList(true)}
              >
                {t("scan")}
              </Button>
            </>
          ) : (
            <ProgressBar percent={Math.round(100 * decoderState.progress)} />
          )}
        </Card>
      </BaseBox>
      {/* Bottom button */}
      <BaseBox position="absolute" bottom={0} w="100%" p={5}>
        <Card
          contentStyle={{
            ...AppStyles.centered,
            paddingHorizontal: 10,
            paddingVertical: 5,
            gap: 2,
          }}
        >
          <Text variant="bodyLarge">{getTestingMessage(t, settings)}</Text>
          {!!decoderState.info && <Text>{decoderState.info}</Text>}
          <BottomButton onPress={onBack}>{t("back")}</BottomButton>
        </Card>
      </BaseBox>
    </BaseVStack>
  );
}

function RunTestsPage({
  pixelId,
  settings,
  onResult,
}: {
  pixelId: number;
  settings: ValidationTestsSettings;
  onResult?: (result: TaskResult) => void;
}) {
  // Keep screen on
  useKeepAwake();

  const noPrint = true;

  const { t } = useTranslation();

  const [pixel, setPixel] = React.useState<Pixel>();
  const [ledCount, setLedCount] = React.useState(0);
  const [dieType, setDieType] = React.useState<PixelDieType>("unknown");
  const onPixelFound = React.useCallback((scannedPixel: ScannedPixel) => {
    setLedCount(scannedPixel.ledCount);
    setDieType(scannedPixel.dieType);
    setPixel(getPixelThroughDispatcher(scannedPixel));
  }, []);

  const [cancel, setCancel] = React.useState(false);
  const [firmwareUpdateStatus, setFirmwareUpdateStatus] =
    React.useState<UpdateFirmwareStatus>();
  const [printStatus, setPrintStatus] = React.useState<PrintStatus | Error>();

  // We must have a Pixel once past the UpdateFirmware task
  const getPixel = (): Pixel => {
    if (!pixel) throw new Error("No Pixel instance");
    return pixel;
  };

  // Some conditions to filter tests
  const seq = settings.sequence;
  const isFwUpdate = seq === "firmwareUpdate";
  const skipIfFwUpdate = { skip: isFwUpdate };
  const skipIfBoard = { skip: isBoard(seq) };
  const skipIfNoCoil = { skip: isFwUpdate || seq === "boardNoCoil" };
  const skipIfDieFinal = { skip: isFwUpdate || seq === "dieFinal" };
  const skipIfNotDieFinal = { skip: isFwUpdate || seq !== "dieFinal" };

  // The entire test sequence
  const taskChain = useTaskChain(cancel ? "cancel" : "run")
    .withTask(
      ...useTaskComponent("UpdateFirmware", cancel, (p) => (
        <UpdateFirmware
          {...p}
          settings={settings}
          pixelId={pixelId}
          onPixelFound={onPixelFound}
          onFirmwareUpdate={setFirmwareUpdateStatus}
        />
      ))
    )
    .withTask(
      ...useTaskComponent("ConnectPixel", cancel, (p) => (
        <ConnectPixel
          {...p}
          settings={settings}
          pixelId={pixelId}
          pixel={pixel}
          onPixelFound={onPixelFound}
          ledCount={ledCount}
          dieType={seq === "dieFinal" ? dieType : undefined}
        />
      )),
      skipIfFwUpdate
    )
    .withTask(
      ...useTaskComponent("WaitCharging", cancel, (p) => (
        <WaitCharging {...p} settings={settings} pixel={getPixel()} />
      )),
      skipIfNoCoil
    )
    .withTask(
      ...useTaskComponent("CheckBoard", cancel, (p) => (
        <CheckBoard
          {...p}
          settings={settings}
          pixel={getPixel()}
          firmwareUpdated={firmwareUpdateStatus === "success"}
        />
      )),
      skipIfFwUpdate
    )
    .withTask(
      ...useTaskComponent("WaitNotCharging", cancel, (p) => (
        <WaitCharging
          {...p}
          settings={settings}
          pixel={getPixel()}
          notCharging
        />
      )),
      skipIfNoCoil
    )
    .withTask(
      ...useTaskComponent("CheckLEDs", cancel, (p) => (
        <CheckLEDs {...p} settings={settings} pixel={getPixel()} />
      )),
      skipIfFwUpdate
    )
    .withTask(
      ...useTaskComponent("WaitFaceUp", cancel, (p) => (
        <WaitFaceUp {...p} settings={settings} pixel={getPixel()} />
      )),
      skipIfBoard
    )
    .withTask(
      ...useTaskComponent("StoreSettings", cancel, (p) => (
        <StoreSettings {...p} settings={settings} pixel={getPixel()} />
      )),
      skipIfFwUpdate
    )
    .withTask(
      ...useTaskComponent("TurnOffDevice", cancel, (p) => (
        <TurnOffDevice {...p} settings={settings} pixel={getPixel()} />
      )),
      skipIfDieFinal
    )
    .withTask(
      ...useTaskComponent("PrepareDie", cancel, (p) => (
        <PrepareDie
          {...p}
          settings={settings}
          pixel={getPixel()}
          onPrintStatus={noPrint ? undefined : setPrintStatus}
        />
      )),
      skipIfNotDieFinal
    )
    .withTask(
      ...useTaskComponent("ConnectPixel", cancel, (p) => (
        <ConnectPixel
          {...p}
          settings={settings}
          pixel={pixel}
          ledCount={ledCount}
        />
      )),
      skipIfNotDieFinal
    )
    .withTask(
      ...useTaskComponent("WaitDieInCase", cancel, (p) => (
        <WaitDieInCase {...p} settings={settings} pixel={getPixel()} />
      )),
      skipIfNotDieFinal
    )
    .withTask(
      ...useTaskComponent("CheckLabel", cancel, (p) => (
        <LabelPrinting
          {...p}
          settings={settings}
          pixel={getPixel()}
          printResult={printStatus}
          onPrintStatus={setPrintStatus}
        />
      )),
      { skip: skipIfNotDieFinal.skip || noPrint }
    );

  // Get result
  const result = getTaskResult(taskChain.status);
  const onOkCancel = () => {
    if (result) {
      onResult?.(result);
    } else {
      setCancel(true);
    }
  };

  // Disconnect when test is done
  React.useEffect(() => {
    if (pixel && result) {
      // Wait just a bit so pending messages can be send
      setTimeout(
        () =>
          pixel
            .disconnect()
            .catch((err) =>
              console.log(
                `Error disconnecting at end of validation test: ${err}`
              )
            ),
        1000
      );
    }
  }, [pixel, result]);

  // Make sure the view is always scrolled to the bottom
  const scrollRef = React.useRef<any>();
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd();
    }
  });

  return (
    <BaseVStack
      w="100%"
      h="100%"
      gap={8}
      alignItems="center"
      justifyContent="center"
      paddingBottom={10}
    >
      <Text variant="titleLarge">{getTestingMessage(t, settings)}</Text>
      <ScrollView
        style={AppStyles.fullWidth}
        contentContainerStyle={AppStyles.listContentContainer}
        ref={scrollRef}
      >
        <>{taskChain.render()}</>
        {result && (
          <BaseVStack
            alignItems="center"
            justifyContent="center"
            paddingBottom={20}
            gap={20}
          >
            <Text style={{ fontSize: 100 }}>
              {getTaskResultEmoji(taskChain.status)}
            </Text>
            <Text variant="headlineMedium">
              {t(`test${capitalize(result)}`)}
            </Text>
            {!!pixel && (
              <Text variant="titleLarge">
                {t("battery")}
                {t("colonSeparator")}
                {t("percentWithValue", { value: pixel.batteryLevel })}
              </Text>
            )}
          </BaseVStack>
        )}
      </ScrollView>
      <BaseBox w="100%" paddingHorizontal={15}>
        <BottomButton
          disabled={firmwareUpdateStatus === "updating"}
          onPress={onOkCancel}
        >
          {result ? t("next") : t("cancel")}
        </BottomButton>
      </BaseBox>
    </BaseVStack>
  );
}

function ValidationPage() {
  const [sequence, setSequence] = React.useState<ValidationSequence>();
  const [dieType, setDieType] = React.useState<PixelDieType>();
  const [pixelId, setPixelId] = React.useState(0);

  const [dfuFilesBundle, isFactoryDfuBundle, dfuFilesError] =
    useFactoryDfuFilesBundle();

  return !sequence || !dfuFilesBundle ? (
    <SelectSequencePage
      onSelectSequence={setSequence}
      dfuFilesBundle={dfuFilesBundle}
      dfuFilesError={dfuFilesError}
      isFactoryDfuBundle={isFactoryDfuBundle}
    />
  ) : !dieType ? (
    <SelectDieTypePage
      sequence={sequence}
      onSelectDieType={setDieType}
      onBack={() => setSequence(undefined)}
    />
  ) : !pixelId ? (
    <DecodePixelIdPage
      settings={{ sequence, dieType }}
      onDecodedPixelId={(pixelId) => {
        console.log("Decoded PixelId:", pixelId);
        setPixelId(pixelId);
      }}
      onBack={() => setDieType(undefined)}
    />
  ) : (
    <RunTestsPage
      settings={{ sequence, dieType, dfuFilesBundle }}
      pixelId={pixelId}
      onResult={(result) => {
        console.log("Validation tests result:", result);
        setPixelId(0);
      }}
    />
  );
}

export function ValidationScreen() {
  return (
    <AppPage>
      <ValidationPage />
    </AppPage>
  );
}
