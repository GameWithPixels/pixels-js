import {
  FastBox,
  FastVStack,
} from "@systemic-games/react-native-base-components";
import {
  Pixel,
  ScannedPixel,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { useErrorHandler } from "react-error-boundary";
import { useTranslation, type TFunction } from "react-i18next";
import { ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import { Button, ButtonProps, Card, Text } from "react-native-paper";
import {
  Camera,
  CameraPermissionStatus,
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
import { DieType, DieTypes } from "~/features/pixels/DieType";
import usePixelIdDecoderFrameProcessor from "~/features/pixels/hooks/usePixelIdDecoderFrameProcessor";
import {
  getTaskResult,
  getTaskResultEmoji,
  TaskResult,
} from "~/features/tasks/TaskResult";
import useTaskChain from "~/features/tasks/useTaskChain";
import useTaskComponent from "~/features/tasks/useTaskComponent";
import {
  getBoardOrDie,
  ValidationFormFactor,
} from "~/features/validation/ValidationFormFactor";
import gs from "~/styles";

function getTestingMessage(
  t: TFunction<"translation", undefined>,
  settings: ValidationTestsSettings
): string {
  return t("testingDieTypeWithFormFactor", {
    dieType: t(settings.dieType),
    formFactor: t(settings.formFactor),
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

function HugeButton({
  height,
  fontSize,
  contentStyle,
  labelStyle,
  ...props
}: ButtonProps & { height: number; fontSize: number }) {
  return (
    <Button
      contentStyle={[{ height }, contentStyle]}
      labelStyle={[
        {
          fontSize,
          fontWeight: "bold",
          lineHeight: undefined,
        },
        labelStyle,
      ]}
      {...props}
    />
  );
}

function SelectFormFactorPage({
  onSelected,
}: {
  onSelected: (formFactor: ValidationFormFactor) => void;
}) {
  const { height } = useWindowDimensions();
  const btnHeight = (height - 200) / 4;
  const { t } = useTranslation();
  return (
    <FastVStack w="100%" h="100%" p={5} justifyContent="space-around">
      <HugeButton
        mode="contained-tonal"
        height={btnHeight}
        fontSize={30}
        onPress={() => onSelected("boardNoCoil")}
      >
        {t("validateBoardNoCoil")}
      </HugeButton>
      <HugeButton
        mode="contained-tonal"
        height={btnHeight}
        fontSize={30}
        onPress={() => onSelected("board")}
      >
        {t("validateFullBoard")}
      </HugeButton>
      <HugeButton
        mode="contained-tonal"
        height={btnHeight}
        fontSize={30}
        onPress={() => onSelected("die")}
      >
        {t("validateResinDie")}
      </HugeButton>
      <HugeButton
        mode="contained-tonal"
        height={btnHeight}
        fontSize={30}
        onPress={() => onSelected("dieFinal")}
      >
        {t("validateDieFinal")}
      </HugeButton>
    </FastVStack>
  );
}

function SelectDieTypePage({
  formFactor,
  onSelectDieType,
  onBack,
}: {
  formFactor: ValidationFormFactor;
  onSelectDieType: (type: DieType) => void;
  onBack?: () => void;
}) {
  const { height } = useWindowDimensions();
  const btnHeight = (height - 200) / (DieTypes.length * 1.5);
  const { t } = useTranslation();
  return (
    <FastVStack w="100%" h="100%" p={5} justifyContent="space-around">
      <Text variant="headlineSmall" style={styles.textCenter}>
        {t("testingFormFactor", { formFactor: t(formFactor) })}
      </Text>
      {DieTypes.map((dt) => (
        <HugeButton
          key={dt}
          mode="contained-tonal"
          height={btnHeight}
          fontSize={24}
          onPress={() => onSelectDieType(dt)}
        >
          {t(dt)}
        </HugeButton>
      ))}
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
  const { t } = useTranslation();
  const errorHandler = useErrorHandler();

  // Camera
  const [cameraPermission, setCameraPermission] =
    React.useState<CameraPermissionStatus>();
  const devices = useCameraDevices("wide-angle-camera");
  const cameraRef = React.useRef<Camera>(null);

  // Camera permissions
  React.useEffect(() => {
    console.log("Requesting camera permission");
    Camera.requestCameraPermission().then((perm) => {
      console.log(`Camera permission: ${perm}`);
      setCameraPermission(perm);
      return perm;
    });
  }, []);

  // We use the back camera
  const device = devices.back;

  // Camera status
  const [cameraStatus, setCameraStatus] =
    React.useState<CameraStatus>("initializing");

  // Update camera status
  React.useEffect(() => {
    if (cameraPermission === "denied") {
      setCameraStatus("needPermission");
      errorHandler(new Error(t("needCameraPermission")));
    } else if (cameraPermission === "authorized" && device) {
      setCameraStatus("ready");
    }
  }, [cameraPermission, device, errorHandler, t]);

  // Frame processor for decoding PixelId
  const [frameProcessor, pixelId, lastColor] =
    usePixelIdDecoderFrameProcessor();

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
        />
      ) : (
        <Text variant="headlineSmall">{t("startingCamera")}</Text>
      )}
      {!readingColors && (
        // Show message on top
        <FastBox position="absolute" top={0} w="100%" p={10}>
          <Card>
            <Card.Content style={{ flexDirection: "row", gap: 10 }}>
              <Text variant="bodyLarge" style={{ flex: 1, flexWrap: "wrap" }}>
                {t("resetUsingMagnet", {
                  formFactor: t(getBoardOrDie(settings.formFactor)),
                })}
              </Text>
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
      {/* Show back button on bottom */}
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
  const { t } = useTranslation();
  const [pixel, setPixel] = React.useState<Pixel>();
  const [cancel, setCancel] = React.useState(false);

  const taskChain = useTaskChain(
    cancel ? "cancel" : "run",
    ...useTaskComponent("UpdateFirmware", cancel, (p) => (
      <UpdateFirmware
        {...p}
        pixelId={pixelId}
        settings={settings}
        onPixelFound={setPixel}
      />
    ))
  ).chainWith(
    ...useTaskComponent("ConnectPixel", cancel, (p) => (
      <ConnectPixel
        {...p}
        pixelId={pixelId}
        settings={settings}
        onPixelFound={setPixel}
      />
    ))
  );
  if (settings.formFactor !== "boardNoCoil") {
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
    ...useTaskComponent("CheckBoard", cancel, (p) => (
      <>{pixel && <CheckBoard {...p} pixel={pixel} settings={settings} />}</>
    ))
  );
  if (settings.formFactor !== "boardNoCoil") {
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
    ...useTaskComponent("CheckLEDs", cancel, (p) => (
      <>{pixel && <CheckLEDs {...p} pixel={pixel} settings={settings} />}</>
    ))
  );
  if (getBoardOrDie(settings.formFactor) === "die") {
    taskChain.chainWith(
      // eslint-disable-next-line react-hooks/rules-of-hooks
      ...useTaskComponent("WaitFaceUp", cancel, (p) => (
        <>{pixel && <WaitFaceUp {...p} pixel={pixel} settings={settings} />}</>
      ))
    );
  }
  if (settings.formFactor !== "dieFinal") {
    taskChain.chainWith(
      // eslint-disable-next-line react-hooks/rules-of-hooks
      ...useTaskComponent("TurnOffDevice", cancel, (p) => (
        <>
          {pixel && <TurnOffDevice {...p} pixel={pixel} settings={settings} />}
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

  const result = getTaskResult(taskChain.status);
  const onOkCancel = () => {
    if (result) {
      onResult?.(result);
    } else {
      setCancel(true);
      onResult?.("canceled");
    }
  };
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
          <FastVStack alignItems="center" justifyContent="center">
            <Text style={{ fontSize: 150 }}>
              {getTaskResultEmoji(taskChain.status)}
            </Text>
            <Text variant="bodyLarge">
              {t("battery")}
              {t("colonSeparator")}
              {t("percentWithValue", { value: pixel?.batteryLevel ?? 0 })}
            </Text>
          </FastVStack>
        )}
      </ScrollView>
      <BottomButton onPress={onOkCancel}>
        {result ? t("ok") : t("cancel")}
      </BottomButton>
    </FastVStack>
  );
}

function ValidationPage() {
  const [formFactor, setFormFactor] = React.useState<ValidationFormFactor>();
  const [dieType, setDieType] = React.useState<DieType>();
  const [pixelId, setPixelId] = React.useState(0);

  return !formFactor ? (
    <SelectFormFactorPage onSelected={setFormFactor} />
  ) : !dieType ? (
    <SelectDieTypePage
      formFactor={formFactor}
      onSelectDieType={setDieType}
      onBack={() => setFormFactor(undefined)}
    />
  ) : !pixelId ? (
    <DecodePixelIdPage
      settings={{ formFactor, dieType }}
      onDecodedPixelId={(pixelId) => {
        console.log("Decoded PixelId:", pixelId);
        setPixelId(pixelId);
      }}
      onBack={() => setDieType(undefined)}
    />
  ) : (
    <RunTestsPage
      settings={{ formFactor, dieType }}
      pixelId={pixelId}
      onResult={(result) => {
        console.log("Validation tests result:", result);
        setPixelId(0);
      }}
    />
  );
}

export default function () {
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
