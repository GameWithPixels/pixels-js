import { useFocusEffect } from "@react-navigation/native";
import {
  FastBox,
  FastVStack,
} from "@systemic-games/react-native-base-components";
import {
  Pixel,
  PixelDieType,
  ScannedPixel,
} from "@systemic-games/react-native-pixels-connect";
import { useKeepAwake } from "expo-keep-awake";
import React from "react";
import { useErrorHandler } from "react-error-boundary";
import { useTranslation, type TFunction } from "react-i18next";
import {
  FlexStyle,
  ScrollView,
  StyleSheet,
  TextStyle,
  useWindowDimensions,
  View,
} from "react-native";
import {
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

import { AppPage } from "~/components/AppPage";
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
} from "~/components/ValidationTestsComponents";
import { usePixelIdDecoderFrameProcessor } from "~/features/hooks/usePixelIdDecoderFrameProcessor";
import {
  getTaskResult,
  getTaskResultEmoji,
  TaskResult,
} from "~/features/tasks/TaskResult";
import { useTaskChain } from "~/features/tasks/useTaskChain";
import { useTaskComponent } from "~/features/tasks/useTaskComponent";
import {
  getBoardOrDie,
  isBoard,
  ValidationSequence,
  ValidationSequences,
} from "~/features/validation/ValidationSequences";
import { capitalize } from "~/i18n";
import gs from "~/styles";

// Board types used for validation
const BoardTypes: readonly PixelDieType[] = [
  "d6",
  "d6pipped",
  "d8",
  "d10",
  "d12",
  "d20",
];

// Die types used for validation
const DieTypes: readonly PixelDieType[] = [
  "d4",
  "d6",
  "d6pipped",
  "d6fudge",
  "d8",
  "d10",
  "d00",
  "d12",
  "d20",
];

function getTestingMessage(
  t: TFunction<"translation", undefined>,
  settings: ValidationTestsSettings
): string {
  return t("testingDieTypeWithSequence", {
    dieType: t(settings.dieType),
    sequence: t(settings.sequence),
  });
}

function BottomButton({
  children,
  onPress,
}: Pick<ButtonProps, "children" | "onPress">) {
  return (
    <Button mode="outlined" style={gs.fullWidth} onPress={onPress}>
      {children}
    </Button>
  );
}

function LargeTonalButton({
  children,
  height,
  width,
  fontSize,
  ...props
}: TouchableRippleProps & {
  height?: FlexStyle["height"];
  width?: FlexStyle["width"];
  fontSize: TextStyle["fontSize"];
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const borderRadius = (theme.isV3 ? 5 : 1) * theme.roundness;
  // Paper's button doesn't have multiline text (by design) so we render our own custom button
  return (
    <TouchableRipple
      rippleColor={theme.colors.surface}
      style={{
        height,
        width,
        backgroundColor: theme.colors.secondaryContainer,
        borderRadius,
        margin: 10,
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
          color: theme.colors.onSecondaryContainer,
        }}
      >
        {children}
      </Text>
    </TouchableRipple>
  );
}

function SelectSequencePage({
  onSelectSequence,
}: {
  onSelectSequence: (sequence: ValidationSequence) => void;
}) {
  const { height } = useWindowDimensions();
  const btnHeight = (height - 180) / ValidationSequences.length;
  const { t } = useTranslation();
  return (
    <FastVStack w="100%" h="100%" px={5} py={10} justifyContent="space-around">
      {ValidationSequences.map((sequence) => (
        <LargeTonalButton
          key={sequence}
          height={btnHeight}
          fontSize={30}
          onPress={() => onSelectSequence(sequence)}
        >
          {t(
            sequence === "firmwareUpdate"
              ? sequence
              : "validate" + sequence[0].toUpperCase() + sequence.substring(1)
          )}
        </LargeTonalButton>
      ))}
    </FastVStack>
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
  const types = isBoard(sequence) ? BoardTypes : DieTypes;
  const { width, height } = useWindowDimensions();
  const btnHeight = (height - 200) / (types.length * 1.5);
  const columns = types.length > 6;
  const { t } = useTranslation();
  return (
    <FastVStack w="100%" h="100%" p={5} justifyContent="space-around">
      <Text variant="headlineSmall" style={styles.textCenter}>
        {t("testingSequence", { sequence: t(sequence) })}
      </Text>
      <View
        style={
          columns
            ? {
                flexGrow: 1,
                flexDirection: "row",
                flexWrap: "wrap",
                alignContent: "space-around",
              }
            : {
                flexGrow: 1,
                justifyContent: "space-around",
              }
        }
      >
        {types.map((dt) => (
          <LargeTonalButton
            key={dt}
            height={columns ? 2 * btnHeight : btnHeight}
            width={columns ? width / 2 - 30 : undefined}
            fontSize={24}
            onPress={() => onSelectDieType(dt)}
          >
            {t(dt)}
          </LargeTonalButton>
        ))}
      </View>
      <BottomButton onPress={onBack}>{t("back")}</BottomButton>
    </FastVStack>
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
  settings: ValidationTestsSettings;
  onBack?: () => void;
}) {
  const theme = useTheme();
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
  const [frameProcessor, pixelId, lastColor, info, lastError] =
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
    if (pixelId) {
      onDecodedPixelId(pixelId);
    }
  }, [onDecodedPixelId, pixelId]);

  // Monitor color changes
  const lastColorChangesRef = React.useRef<number[]>([]);
  const [readingColors, setReadingColors] = React.useState(false);
  React.useEffect(() => {
    const lastColorsChanges = lastColorChangesRef.current;
    if (lastColor) {
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
  }, [lastColor]);

  // Scan list
  const [showScanList, setShowScanList] = React.useState(false);

  const onSelect = React.useCallback(
    (sp: ScannedPixel) => onDecodedPixelId(sp.pixelId),
    [onDecodedPixelId]
  );
  const onClose = React.useCallback(() => setShowScanList(false), []);

  return showScanList ? (
    <FastBox w="100%" h="100%">
      <ScannedPixelsList onSelect={onSelect} onClose={onClose} />
    </FastBox>
  ) : (
    <FastVStack w="100%" h="100%" alignItems="center" justifyContent="center">
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
      {(!readingColors || lastError) && (
        // Show message on top
        <FastBox position="absolute" top={0} w="100%" p={10}>
          <Card>
            <Card.Content style={{ flexDirection: "row", gap: 10 }}>
              {lastError ? (
                <Card.Content style={{ flex: 1 }}>
                  <Text
                    variant="bodyLarge"
                    style={{ flex: 1, color: theme.colors.error }}
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
            </Card.Content>
          </Card>
        </FastBox>
      )}
      {/* Show info and back button on bottom */}
      <FastBox position="absolute" bottom={0} w="100%" p={10}>
        <Card>
          <Card.Content
            style={{
              gap: 10,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text variant="bodyLarge">{getTestingMessage(t, settings)}</Text>
            <BottomButton onPress={onBack}>{t("back")}</BottomButton>
          </Card.Content>
          <Text style={{ alignSelf: "center", marginVertical: 2 }}>{info}</Text>
        </Card>
      </FastBox>
    </FastVStack>
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

  const { t } = useTranslation();
  const [pixel, setPixel] = React.useState<Pixel>();
  const [cancel, setCancel] = React.useState(false);
  const [firmwareUpdated, setFirmwareUpdated] = React.useState(false);
  const onFirmwareUpdated = React.useCallback(
    () => setFirmwareUpdated(true),
    []
  );

  const taskChain = useTaskChain(
    cancel ? "cancel" : "run",
    ...useTaskComponent("UpdateFirmware", cancel, (p) => (
      <UpdateFirmware
        {...p}
        pixelId={pixelId}
        settings={settings}
        onPixelFound={setPixel}
        onFirmwareUpdated={onFirmwareUpdated}
      />
    ))
  );
  if (settings.sequence !== "firmwareUpdate") {
    taskChain.chainWith(
      // eslint-disable-next-line react-hooks/rules-of-hooks
      ...useTaskComponent("ConnectPixel", cancel, (p) => (
        <ConnectPixel
          {...p}
          pixelId={pixelId}
          settings={settings}
          onPixelFound={setPixel}
        />
      ))
    );
    if (settings.sequence !== "boardNoCoil") {
      taskChain.chainWith(
        // eslint-disable-next-line react-hooks/rules-of-hooks
        ...useTaskComponent("WaitCharging", cancel, (p) => (
          <>
            {pixel && <WaitCharging {...p} pixel={pixel} settings={settings} />}
          </>
        ))
      );
    }
    taskChain.chainWith(
      // eslint-disable-next-line react-hooks/rules-of-hooks
      ...useTaskComponent("CheckBoard", cancel, (p) => (
        <>
          {pixel && (
            <CheckBoard
              {...p}
              pixel={pixel}
              settings={settings}
              firmwareUpdated={firmwareUpdated}
            />
          )}
        </>
      ))
    );
    if (settings.sequence !== "boardNoCoil") {
      taskChain.chainWith(
        // eslint-disable-next-line react-hooks/rules-of-hooks
        ...useTaskComponent("WaitNotCharging", cancel, (p) => (
          <>
            {pixel && (
              <WaitCharging
                {...p}
                pixel={pixel}
                settings={settings}
                notCharging
              />
            )}
          </>
        ))
      );
    }
    taskChain.chainWith(
      // eslint-disable-next-line react-hooks/rules-of-hooks
      ...useTaskComponent("CheckLEDs", cancel, (p) => (
        <>{pixel && <CheckLEDs {...p} pixel={pixel} settings={settings} />}</>
      ))
    );
    if (!isBoard(settings.sequence)) {
      taskChain.chainWith(
        // eslint-disable-next-line react-hooks/rules-of-hooks
        ...useTaskComponent("WaitFaceUp", cancel, (p) => (
          <>
            {pixel && <WaitFaceUp {...p} pixel={pixel} settings={settings} />}
          </>
        ))
      );
    }
    if (settings.sequence !== "dieFinal") {
      taskChain.chainWith(
        // eslint-disable-next-line react-hooks/rules-of-hooks
        ...useTaskComponent("TurnOffDevice", cancel, (p) => (
          <>
            {pixel && (
              <TurnOffDevice {...p} pixel={pixel} settings={settings} />
            )}
          </>
        ))
      );
    } else {
      taskChain
        .chainWith(
          // eslint-disable-next-line react-hooks/rules-of-hooks
          ...useTaskComponent("PrepareDie", cancel, (p) => (
            <>
              {pixel && <PrepareDie {...p} pixel={pixel} settings={settings} />}
            </>
          ))
        )
        .chainWith(
          // eslint-disable-next-line react-hooks/rules-of-hooks
          ...useTaskComponent("ConnectPixel", cancel, (p) => (
            <ConnectPixel
              {...p}
              pixelId={pixelId}
              settings={settings}
              onPixelFound={setPixel}
            />
          ))
        )
        .chainWith(
          // eslint-disable-next-line react-hooks/rules-of-hooks
          ...useTaskComponent("WaitDieInCase", cancel, (p) => (
            <>
              {pixel && (
                <WaitDieInCase {...p} pixel={pixel} settings={settings} />
              )}
            </>
          ))
        );
    }
  }

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
    <FastVStack
      w="100%"
      h="100%"
      gap={8}
      alignItems="center"
      justifyContent="center"
    >
      <Text variant="titleLarge">{getTestingMessage(t, settings)}</Text>
      <ScrollView
        style={gs.fullWidth}
        contentContainerStyle={gs.listContentContainer}
        ref={scrollRef}
      >
        <>{taskChain.render()}</>
        {result && (
          <FastVStack alignItems="center" justifyContent="center" gap={10}>
            <Text style={{ fontSize: 100 }}>
              {getTaskResultEmoji(taskChain.status)}
            </Text>
            <Text variant="headlineMedium">
              {t(`test${capitalize(result)}`)}
            </Text>
            <Text variant="titleLarge">
              {t("battery")}
              {t("colonSeparator")}
              {t("percentWithValue", { value: pixel?.batteryLevel ?? 0 })}
            </Text>
          </FastVStack>
        )}
      </ScrollView>
      <BottomButton onPress={onOkCancel}>
        {result ? t("next") : t("cancel")}
      </BottomButton>
    </FastVStack>
  );
}

function ValidationPage() {
  const [sequence, setSequence] = React.useState<ValidationSequence>();
  const [dieType, setDieType] = React.useState<PixelDieType>();
  const [pixelId, setPixelId] = React.useState(0);

  return !sequence ? (
    <SelectSequencePage onSelectSequence={setSequence} />
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
      settings={{ sequence, dieType }}
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

const styles = StyleSheet.create({
  textCenter: {
    textAlign: "center",
  },
});
