import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";
import { assert, range } from "@systemic-games/pixels-core-utils";
import {
  Charger,
  DiceUtils,
  getPixelIdFromName,
  Pixel,
  PixelColorway,
  PixelsNamePrefixes,
  ScannedCharger,
  ScannedPixel,
} from "@systemic-games/react-native-pixels-connect";
import { useKeepAwake } from "expo-keep-awake";
import React from "react";
import { useErrorBoundary } from "react-error-boundary";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import {
  Button,
  ButtonProps,
  Card,
  IconButton,
  Menu,
  Text,
  TextInput,
  TouchableRipple,
  TouchableRippleProps,
  useTheme,
} from "react-native-paper";
import {
  Camera,
  CameraPermissionStatus,
  CameraRuntimeError,
  useCameraDevice,
  useCameraFormat,
} from "react-native-vision-camera";

import { AppStyles } from "~/AppStyles";
import { useAppSelector } from "~/app/hooks";
import { AppPage } from "~/components/AppPage";
import { BaseBox } from "~/components/BaseBox";
import { BaseHStack } from "~/components/BaseHStack";
import { BaseVStack } from "~/components/BaseVStack";
import { ColorwayImage } from "~/components/ColorwayImage";
import { DiceSetImage } from "~/components/DiceSetImage";
import { ProgressBar } from "~/components/ProgressBar";
import { ScannedPixelsList } from "~/components/ScannedPixelsList";
import { SelectColorwayModal } from "~/components/SelectColorwayModal";
import { SelectDiceSetTypeModal } from "~/components/SelectDiceSetTypeModal";
import {
  CheckBoard,
  CheckLEDs,
  ConnectPixel,
  LabelPrinting,
  PrepareDevice,
  ScanAndUpdateFirmware,
  StoreSettings,
  TurnOffDevice,
  UpdateFirmware,
  UpdateFirmwareStatus,
  ValidationTestsSettings,
  WaitCharging,
  WaitDieInCase,
  WaitFaceUp,
} from "~/components/ValidationTestsComponents";
import { getBorderRadius } from "~/features/getBorderRadius";
import ChargerDispatcher from "~/features/pixels/ChargerDispatcher";
import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import { PrintStatus } from "~/features/print";
import { DiceSetType } from "~/features/set";
import { selectSkipPrintLabel } from "~/features/store/validationSelectors";
import {
  getTaskResult,
  getTaskResultEmoji,
  TaskComponent,
  TaskOperation,
  TaskResult,
  useTaskChain,
  useTaskComponent as useTaskComponentUntyped,
} from "~/features/tasks";
import { toLocaleDateTimeString } from "~/features/toLocaleDateTimeString";
import {
  getBoardOrDie,
  getTaskErrorCode,
  isBoard,
  ProductInfo,
  TaskNames,
  ValidationBoardTypes,
  ValidationDeviceSelection,
  ValidationDieTypes,
  ValidationError,
  ValidationSequence,
  ValidationSequences,
} from "~/features/validation";
import {
  FactoryDfuFilesBundle,
  useFactoryDfuFilesBundle,
} from "~/hooks/useFactoryDfuFilesBundle";
import { usePixelIdDecoderFrameProcessor } from "~/hooks/usePixelIdDecoderFrameProcessor";
import { capitalize } from "~/i18n";

const useTaskComponent = useTaskComponentUntyped as (
  taskName: (typeof TaskNames)[number],
  cancel: boolean,
  taskComponent: TaskComponent
) => [TaskOperation, React.FC];

function getValidationSequenceName(
  t: ReturnType<typeof useTranslation>["t"],
  sequence: ValidationSequence
): string {
  return t(
    sequence === "firmwareUpdate" ? sequence : "validate" + capitalize(sequence)
  );
}

function getDieValidationSequenceName(
  t: ReturnType<typeof useTranslation>["t"],
  settings: Pick<ValidationTestsSettings, "deviceSelection" | "sequence">
): string {
  const seqName = getValidationSequenceName(t, settings.sequence);

  return settings.deviceSelection.kind === "charger"
    ? seqName
    : seqName + t("colonSeparator") + t(settings.deviceSelection.dieType);
}

function getErrorCode(error?: Error): number | undefined {
  function getBaseErrorCode(error?: Error): number | undefined {
    if (error) {
      const baseCode = getTaskErrorCode(
        // @ts-ignore Assuming the message is the task name
        error.message
      );
      return baseCode ?? getBaseErrorCode(error.cause as Error);
    }
  }
  function getErrorCode(error?: Error): number | undefined {
    if (error) {
      return error instanceof ValidationError
        ? error.errorCode
        : getErrorCode(error.cause as Error);
    }
  }

  const baseCode = getBaseErrorCode(error);
  const errCode = getErrorCode(error);
  if (errCode && errCode > 100) {
    return errCode;
  } else if (baseCode) {
    return baseCode + (errCode ?? 0);
  }
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
  const extraOptions: ValidationSequence[] = [
    "firmwareUpdate",
    "boardNoCoil",
    "dieReconfigure",
  ];
  const [visible, setVisible] = React.useState(false);
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <BaseVStack
      w="100%"
      h="100%"
      px={5}
      pb={10}
      gap={30}
      justifyContent="space-around"
    >
      <BaseHStack gap={10} mt={10} mb={-10}>
        {dfuFilesError ? (
          <BaseVStack
            flex={1}
            padding={10}
            alignSelf="center"
            backgroundColor={colors.errorContainer}
          >
            <Text
              variant="bodyLarge"
              style={{ color: colors.onErrorContainer }}
            >
              {t("errorLoadingFirmwareFiles") +
                t("colonSeparator") +
                dfuFilesError.message}
            </Text>
          </BaseVStack>
        ) : dfuFilesBundle && !isFactoryDfuBundle ? (
          <BaseVStack
            flex={1}
            padding={10}
            alignSelf="center"
            backgroundColor={colors.primaryContainer}
          >
            <Text
              variant="bodyLarge"
              style={{ color: colors.onPrimaryContainer }}
            >
              {t("diceUpdatedWithCustomFirmwareWarning")}
            </Text>
            <Text
              variant="bodyLarge"
              style={{ color: colors.onPrimaryContainer }}
            >
              {"-> "}
              {dfuFilesBundle?.date
                ? toLocaleDateTimeString(dfuFilesBundle.date)
                : t("loadingFirmwareFiles")}
            </Text>
          </BaseVStack>
        ) : (
          <BaseVStack flex={1} alignItems="center" alignSelf="center">
            <Text variant="titleSmall">
              {dfuFilesBundle
                ? t("updateFirmwareIfOlderWithDate", { date: fwDateLabel })
                : t("loadingFirmwareFiles")}
            </Text>
          </BaseVStack>
        )}
        <Menu
          visible={visible}
          onDismiss={() => setVisible(false)}
          anchorPosition="bottom"
          anchor={
            <IconButton
              icon={() => (
                <MaterialIcons
                  name="more-horiz"
                  size={24}
                  color={colors.onSecondaryContainer}
                />
              )}
              onPress={() => setVisible(true)}
              style={{
                borderColor: colors.onSecondaryContainer,
                borderWidth: 1,
              }}
            />
          }
        >
          {extraOptions.map((s) => (
            <Menu.Item
              key={s}
              onPress={() => onSelectSequence(s)}
              title={getValidationSequenceName(t, s)}
            />
          ))}
        </Menu>
      </BaseHStack>
      {ValidationSequences.filter((s) => !extraOptions.includes(s)).map((s) => (
        <LargeTonalButton
          key={s}
          disabled={!!dfuFilesError || !dfuFilesBundle}
          onPress={() => onSelectSequence(s)}
        >
          {getValidationSequenceName(t, s)}
        </LargeTonalButton>
      ))}
    </BaseVStack>
  );
}

function SelectDieTypePage({
  sequence,
  onSelectDevice,
}: Omit<React.ComponentProps<typeof SelectDeviceTypePage>, "onBack">) {
  assert(sequence !== "lccFinal", "Only dice validation sequence supported");
  const types = isBoard(sequence) ? ValidationBoardTypes : ValidationDieTypes;
  const items =
    types.length > 6
      ? range(types.length / 2).map((i) => [types[2 * i], types[2 * i + 1]]) // Breaks in 2 columns
      : types.map((t) => [t]);
  const { t } = useTranslation();
  return (
    <>
      {items.map((items, i) => (
        <View key={i} style={{ flex: 1, flexDirection: "row", gap: 20 }}>
          {items.map((dieType) =>
            dieType ? (
              <LargeTonalButton
                key={dieType}
                onPress={() => onSelectDevice({ kind: "die", dieType })}
              >
                {t(dieType)}
              </LargeTonalButton>
            ) : (
              // Empty item
              <View key="empty" style={{ flex: 1 }} />
            )
          )}
        </View>
      ))}
    </>
  );
}

function ButtonCard({
  children,
  style,
  ...props
}: TouchableRippleProps & { style?: StyleProp<ViewStyle> }) {
  const { colors, roundness } = useTheme();
  return (
    <TouchableRipple
      style={[
        {
          width: "100%",
          padding: 20,
          alignItems: "center",
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: getBorderRadius(roundness),
          backgroundColor: colors.secondaryContainer,
        },
        style,
      ]}
      {...props}
    >
      <>{children}</>
    </TouchableRipple>
  );
}

function SelectSetTypePage({
  sequence,
  onSelectDevice,
}: Omit<React.ComponentProps<typeof SelectDeviceTypePage>, "onBack">) {
  assert(sequence === "lccFinal", "Only LCC validation sequence supported");

  const [colorway, setColorway] = React.useState<PixelColorway>("unknown");
  const [selectColorway, setSelectColorway] = React.useState(false);
  const [setType, setSetType] = React.useState<DiceSetType>("unknown");
  const [selectSetType, setSelectSetType] = React.useState(false);

  const { t } = useTranslation();
  return (
    <BaseVStack
      flex={1}
      px={10}
      alignItems="center"
      justifyContent="space-between"
    >
      <ButtonCard onPress={() => setSelectColorway(true)}>
        <Text variant="headlineSmall" style={{ marginBottom: 10 }}>
          {t("selectColorway")}
        </Text>
        <ColorwayImage
          colorway={colorway}
          style={colorway === "unknown" && { borderWidth: 0 }}
        />
        <SelectColorwayModal
          visible={selectColorway}
          onDismiss={() => setSelectColorway(false)}
          onSelect={(c) => {
            setColorway(c);
            setSelectColorway(false);
          }}
        />
      </ButtonCard>
      <ButtonCard onPress={() => setSelectSetType(true)}>
        <Text variant="headlineSmall">{t("selectSetType")}</Text>
        <Text variant="headlineSmall" style={{ marginVertical: 10 }}>
          {setType !== "unknown" ? t(setType) : "???"}
        </Text>
        <SelectDiceSetTypeModal
          visible={selectSetType}
          onDismiss={() => setSelectSetType(false)}
          onSelect={(st) => {
            setSetType(st);
            setSelectSetType(false);
          }}
        />
      </ButtonCard>
      <DiceSetImage
        setType={setType}
        colorway={colorway}
        style={colorway === "unknown" && { borderWidth: 0 }}
      />
      <Button
        mode="contained-tonal"
        style={AppStyles.fullWidth}
        disabled={colorway === "unknown" || setType === "unknown"}
        onPress={() => onSelectDevice({ kind: "charger", setType, colorway })}
      >
        {t("ok")}
      </Button>
    </BaseVStack>
  );
}

function SelectDeviceTypePage({
  onBack,
  ...props
}: {
  sequence: ValidationSequence;
  onSelectDevice: (selection: ValidationDeviceSelection) => void;
  onBack?: () => void;
}) {
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
        {getValidationSequenceName(t, props.sequence)}
      </Text>

      {props.sequence === "lccFinal" ? (
        <SelectSetTypePage {...props} />
      ) : (
        <SelectDieTypePage {...props} />
      )}
      <BaseBox px={10}>
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
  settings,
  onDecodePixelId,
  onBack,
}: {
  settings: Pick<ValidationTestsSettings, "deviceSelection" | "sequence">;
  onDecodePixelId: (pixelId: number) => void;
  onBack?: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { showBoundary } = useErrorBoundary();

  // Camera
  const [cameraPermission, setCameraPermission] =
    React.useState<CameraPermissionStatus>();
  const device = useCameraDevice("back");

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

  // Camera status
  const [cameraStatus, setCameraStatus] =
    React.useState<CameraStatus>("initializing");

  // Update camera status
  React.useEffect(() => {
    if (!cameraPermission) {
      setCameraStatus("initializing");
    } else if (cameraPermission === "denied") {
      setCameraStatus("needPermission");
      showBoundary(new Error(t("needCameraPermission")));
    } else if (cameraPermission === "granted" && device) {
      setCameraStatus("ready");
    }
  }, [cameraPermission, device, showBoundary, t]);

  // Format
  const format = useCameraFormat(device, [
    { videoResolution: { width: 1280, height: 720 } },
    { fps: 60 },
    { videoStabilizationMode: "off" },
  ]);

  // Camera error
  const [cameraError, setCameraError] = React.useState<CameraRuntimeError>();

  // Frame processor for decoding PixelId
  const [frameProcessor, decoderState, lastProcError] =
    usePixelIdDecoderFrameProcessor();

  // Log FPS suggestions for frame processor
  // const onSuggestion = React.useCallback(
  //   (suggestion: FrameProcessorPerformanceSuggestion) =>
  //     console.log(
  //       `Frame processor suggestion: ${suggestion.type} ${suggestion.suggestedFrameProcessorFps}`
  //     ),
  //   []
  // );
  // Notify when pixel id has been decoded
  React.useEffect(() => {
    if (decoderState.pixelId) {
      onDecodePixelId(decoderState.pixelId);
    }
  }, [onDecodePixelId, decoderState.pixelId]);

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
    (sp: ScannedPixel | ScannedCharger) => onDecodePixelId(sp.pixelId),
    [onDecodePixelId]
  );
  const onClose = React.useCallback(() => setShowScanList(false), []);

  return showScanList ? (
    <BaseBox w="100%" h="100%">
      <ScannedPixelsList
        ledCount={
          settings.deviceSelection.kind === "charger"
            ? [3]
            : DiceUtils.getLEDCountEx(settings.deviceSelection.dieType)
        }
        onSelect={onSelect}
        onSelectCharger={onSelect}
        onClose={onClose}
      />
    </BaseBox>
  ) : (
    <BaseVStack w="100%" h="100%" alignItems="center" justifyContent="center">
      {device && cameraStatus === "ready" ? (
        <Camera
          style={AppStyles.fullSize}
          isActive
          device={device}
          format={format}
          pixelFormat="yuv"
          videoHdr={false}
          lowLightBoost={false}
          videoStabilizationMode="off"
          frameProcessor={frameProcessor}
          onError={setCameraError}
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
          {!readingColors || cameraError || lastProcError ? (
            <>
              {cameraError || lastProcError ? (
                <Card.Content style={{ flex: 1 }}>
                  <Text
                    variant="bodyLarge"
                    style={{ flex: 1, color: colors.error }}
                  >{`${cameraError ?? lastProcError}`}</Text>
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
          <Text variant="bodyLarge">
            {getDieValidationSequenceName(t, settings)}
          </Text>
          {!!decoderState.info && <Text>{decoderState.info}</Text>}
          <BottomButton onPress={onBack}>{t("back")}</BottomButton>
        </Card>
      </BaseBox>
    </BaseVStack>
  );
}

function InputPixelIdPage({
  settings,
  onEnterPixelId,
  onBack,
}: {
  settings: ValidationTestsSettings;
  onEnterPixelId: (pixelId: number) => void;
  onBack?: () => void;
}) {
  const { t } = useTranslation();
  const [text, setText] = React.useState<string>(
    PixelsNamePrefixes.die.bootloader
  );
  const pixelId = getPixelIdFromName(text);
  const validate = () => pixelId && onEnterPixelId(pixelId);
  return (
    <BaseBox w="100%" h="100%">
      <BaseVStack w="100%" h="100%" px={5} gap={20}>
        <Text variant="titleLarge" style={{ alignSelf: "center" }}>
          {getDieValidationSequenceName(t, settings)}
        </Text>
        <Text variant="bodyLarge">
          {t("enterSNFromLabel")}
          {t("colonSeparator")}
        </Text>
        <BaseHStack w="100%" alignItems="center" gap={10}>
          <TextInput
            autoFocus
            dense
            mode="outlined"
            inputMode="text"
            keyboardAppearance="dark"
            value={text}
            onChangeText={(text) => setText(text)}
            onEndEditing={validate}
            style={{ flex: 1 }}
          />
          <Button
            mode="contained-tonal"
            disabled={!pixelId}
            onPress={validate}
            style={{ alignSelf: "center" }}
          >
            {t("ok")}
          </Button>
        </BaseHStack>
        <Text>
          {text === PixelsNamePrefixes.die.bootloader
            ? t("numberMadeOf8CharactersNoCase")
            : !pixelId
              ? t("invalidSN")
              : t("pressOkOrReturnToValidate")}
          .
        </Text>
      </BaseVStack>
      {/* Bottom button */}
      <BaseBox position="absolute" bottom={0} w="100%" px={15} py={10}>
        <BottomButton onPress={onBack}>{t("back")}</BottomButton>
      </BaseBox>
    </BaseBox>
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

  const [pixel, setPixel] = React.useState<Pixel | Charger>();
  const [scannedPixel, setScannedPixel] = React.useState<
    ScannedPixel | ScannedCharger
  >();
  const onPixelFound = React.useCallback(
    (scannedPixel: ScannedPixel | ScannedCharger) => {
      setScannedPixel({ ...scannedPixel });
      // Going through the PixelDispatcher to retrieve the Pixel instance
      // to ensure that logging is enabled
      if (scannedPixel.type === "die") {
        setPixel(PixelDispatcher.getOrCreateDispatcher(scannedPixel).pixel);
      } else {
        // if (scannedPixel.type === "charger") {
        // TODO casting charger to Pixel for now
        setPixel(ChargerDispatcher.getOrCreateDispatcher(scannedPixel).pixel);
      }
    },
    []
  );

  const [cancel, setCancel] = React.useState(false);
  const [firmwareUpdateStatus, setFirmwareUpdateStatus] =
    React.useState<UpdateFirmwareStatus>();
  const [printStatus, setPrintStatus] = React.useState<{
    status: PrintStatus | Error;
    productInfo: ProductInfo;
  }>();

  // We must have a Pixel once past the UpdateFirmware task
  const getPixel = (): Pixel | Charger => {
    if (!pixel) throw new Error("No Pixel or Charger instance");
    return pixel;
  };

  // Some conditions to filter tests
  const seq = settings.sequence;
  const isFwUpdate = seq === "firmwareUpdate";
  const isLcc = seq === "lccFinal";
  const isFinalForSet = seq === "dieFinalForSet" || isLcc;
  const isFinal = seq === "dieFinalSingle" || isFinalForSet;
  const isReconfig = seq === "dieReconfigure";
  const skipCharging = {
    skip: isFwUpdate || seq === "boardNoCoil" || isReconfig || isLcc,
  };
  const skipFaceUp = { skip: isBoard(seq) || isReconfig || isLcc };
  const skipTurnOff = { skip: isFwUpdate || isFinal || isReconfig };
  const skipPrepare = { skip: !isFinal && !isReconfig };
  const skipIfNotReconfig = { skip: !isReconfig };

  const noPrintRef = React.useRef(
    useAppSelector(selectSkipPrintLabel) || // We use a ref because this setting could change during the test, but we don't want to modify the test sequence in the middle of it
      (isFinalForSet && !isLcc)
  );

  // The entire test sequence
  const taskChain = useTaskChain(cancel ? "cancel" : "run")
    .withTask(
      ...useTaskComponent("UpdateFirmware", cancel, (p) => (
        <ScanAndUpdateFirmware
          {...p}
          settings={settings}
          pixelId={pixelId}
          reconfigure={isReconfig}
          onPixelFound={onPixelFound}
          onFirmwareUpdate={setFirmwareUpdateStatus}
        />
      ))
    )
    // Skip connecting if only updating firmware
    .withTask(
      ...useTaskComponent("ConnectPixel", cancel, (p) => (
        <ConnectPixel
          {...p}
          settings={settings}
          pixel={getPixel()}
          ledCount={scannedPixel?.ledCount}
          deviceType={
            scannedPixel?.type === "charger"
              ? "lcc"
              : isFinal
                ? scannedPixel?.dieType
                : undefined
          }
        />
      )),
      { skip: isFwUpdate }
    )
    // Wait for die to report charging
    .withTask(
      ...useTaskComponent("WaitCharging", cancel, (p) => (
        <WaitCharging {...p} settings={settings} pixel={getPixel()} />
      )),
      skipCharging
    )
    // Skip checking board if only updating firmware
    .withTask(
      ...useTaskComponent("CheckBoard", cancel, (p) => (
        <CheckBoard {...p} settings={settings} pixel={getPixel()} />
      )),
      { skip: isFwUpdate || isLcc }
    )
    // Wait for die to report not charging
    .withTask(
      ...useTaskComponent("WaitNotCharging", cancel, (p) => (
        <WaitCharging
          {...p}
          settings={settings}
          pixel={getPixel()}
          notCharging
        />
      )),
      skipCharging
    )
    // Ask operator to confirm all LEDs are on
    .withTask(
      ...useTaskComponent("CheckLEDs", cancel, (p) => (
        <CheckLEDs {...p} settings={settings} pixel={getPixel()} />
      )),
      { skip: isFwUpdate || isReconfig || isLcc }
    )
    // Ask operator to place die blinking face up
    .withTask(
      ...useTaskComponent("WaitFaceUp", cancel, (p) => (
        <WaitFaceUp {...p} settings={settings} pixel={getPixel()} />
      )),
      skipFaceUp
    )
    // Store settings if not updating firmware
    .withTask(
      ...useTaskComponent("StoreSettings", cancel, (p) => (
        <StoreSettings {...p} settings={settings} pixel={getPixel()} />
      )),
      { skip: isFwUpdate }
    )
    // Turn die off if not finalizing, updating firmware, or reconfiguring
    .withTask(
      ...useTaskComponent("TurnOffDevice", cancel, (p) => (
        <TurnOffDevice {...p} settings={settings} pixel={getPixel()} />
      )),
      skipTurnOff
    )
    // Prepare die in final validation or when re-configuring
    .withTask(
      ...useTaskComponent("PrepareDevice", cancel, (p) => (
        <PrepareDevice
          {...p}
          settings={settings}
          pixel={getPixel()}
          onPrintStatus={noPrintRef.current ? undefined : setPrintStatus}
        />
      )),
      skipPrepare
    )
    // Restore firmware when re-configuring
    .withTask(
      ...useTaskComponent("UpdateFirmware", cancel, (p) => (
        <UpdateFirmware
          {...p}
          settings={settings}
          scannedPixel={scannedPixel}
          onFirmwareUpdate={setFirmwareUpdateStatus}
        />
      )),
      skipIfNotReconfig
    )
    // Reconnect to die in final validation or when re-configuring
    .withTask(
      ...useTaskComponent("ConnectPixel", cancel, (p) => (
        <ConnectPixel {...p} settings={settings} pixel={getPixel()} />
      )),
      skipPrepare
    )
    // Wait for die to be put in case in final validation except if finalizing die for set
    .withTask(
      ...useTaskComponent("WaitDieInCase", cancel, (p) => (
        <WaitDieInCase {...p} settings={settings} pixel={getPixel()} />
      )),
      { skip: skipPrepare.skip || isFinalForSet }
    )
    // Turn die off if finalizing die for set
    .withTask(
      ...useTaskComponent("TurnOffDevice", cancel, (p) => (
        <TurnOffDevice {...p} settings={settings} pixel={getPixel()} />
      )),
      { skip: !isFinalForSet }
    )
    // Ask operator to confirm label was printed
    .withTask(
      ...useTaskComponent("CheckLabel", cancel, (p) => (
        <LabelPrinting
          {...p}
          printResult={printStatus}
          onPrintStatus={setPrintStatus}
        />
      )),
      { skip: skipPrepare.skip || noPrintRef.current }
    );

  // Get result
  const result = getTaskResult(taskChain.status);
  const onOkCancel = React.useCallback(() => {
    if (result) {
      onResult?.(result);
    } else {
      setCancel(true);
    }
  }, [onResult, result]);

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
      <Text variant="titleLarge">
        {getDieValidationSequenceName(t, settings)}
      </Text>
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
              {result === "failed"
                ? `${t("error")}${t("colonSeparator")}${getErrorCode(taskChain.lastError) ?? t("unknown")}`
                : t(`test${capitalize(result)}`)}
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
  const [deviceSelection, setDeviceSelection] =
    React.useState<ValidationDeviceSelection>();
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
  ) : !deviceSelection ? (
    <SelectDeviceTypePage
      sequence={sequence}
      onSelectDevice={setDeviceSelection}
      onBack={() => setSequence(undefined)}
    />
  ) : !pixelId ? (
    sequence !== "dieReconfigure" ? (
      <DecodePixelIdPage
        settings={{ sequence, deviceSelection }}
        onDecodePixelId={(pixelId) => {
          console.log("Decoded PixelId:", pixelId);
          setPixelId(pixelId);
        }}
        onBack={() => setDeviceSelection(undefined)}
      />
    ) : (
      <InputPixelIdPage
        settings={{ sequence, deviceSelection, dfuFilesBundle }}
        onEnterPixelId={(pixelId) => {
          console.log("Entered PixelId:", pixelId);
          setPixelId(pixelId);
        }}
        onBack={() => setDeviceSelection(undefined)}
      />
    )
  ) : (
    <RunTestsPage
      settings={{ sequence, deviceSelection, dfuFilesBundle }}
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
