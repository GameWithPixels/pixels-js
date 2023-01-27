import { Pixel } from "@systemic-games/react-native-pixels-connect";
import {
  extendTheme,
  useColorModeValue,
  Button,
  Center,
  HStack,
  NativeBaseProvider,
  ScrollView,
  Text,
  VStack,
  Box,
} from "native-base";
import React, { useEffect, useRef, useState } from "react";
import { useErrorHandler } from "react-error-boundary";
import { useTranslation, type TFunction } from "react-i18next";
import {
  Camera,
  CameraPermissionStatus,
  useCameraDevices,
} from "react-native-vision-camera";

import AppPage from "~/components/AppPage";
import PixelScanList from "~/components/PixelScanList";
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

function getTestingMessage(
  t: TFunction<"translation", undefined>,
  settings: ValidationTestsSettings
): string {
  return t("testingDieTypeWithFormFactor", {
    dieType: t(settings.dieType),
    formFactor: t(settings.formFactor),
  });
}

function SelectFormFactorPage({
  onSelected,
}: {
  onSelected: (formFactor: ValidationFormFactor) => void;
}) {
  const { t } = useTranslation();
  return (
    <VStack w="100%" h="100%" p="5" bg={useBackgroundColor()}>
      <Button h="20%" my="10%" onPress={() => onSelected("boardNoCoil")}>
        {t("validateBoardNoCoil")}
      </Button>
      <Button h="20%" my="10%" onPress={() => onSelected("board")}>
        {t("validateFullBoard")}
      </Button>
      <Button h="20%" my="10%" onPress={() => onSelected("die")}>
        {t("validateCastDie")}
      </Button>
    </VStack>
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
  const { t } = useTranslation();
  return (
    <VStack w="100%" h="100%" p="2" bg={useBackgroundColor()}>
      <Text variant="comment" textAlign="center">
        {t("testingFormFactor", { formFactor: t(formFactor) })}
      </Text>
      <VStack h="85%" p="2" justifyContent="center">
        {DieTypes.map((dt) => (
          <Button key={dt} my="2" onPress={() => onSelectDieType(dt)}>
            {t(dt)}
          </Button>
        ))}
      </VStack>
      <Button m="2" onPress={onBack}>
        {t("back")}
      </Button>
    </VStack>
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
    useState<CameraPermissionStatus>();
  const devices = useCameraDevices("wide-angle-camera");
  const cameraRef = useRef<Camera>(null);

  // Camera permissions
  useEffect(() => {
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
    useState<CameraStatus>("initializing");

  // Update camera status
  useEffect(() => {
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
  useEffect(() => {
    if (pixelId) {
      onDecodedPixelId(pixelId);
    }
  }, [onDecodedPixelId, pixelId]);

  // Monitor color changes
  const lastColorChangesRef = useRef<number[]>([]);
  const [readingColors, setReadingColors] = useState(false);
  useEffect(() => {
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
  const [showScanList, setShowScanList] = useState(false);

  const bg = useBackgroundColor();
  return showScanList ? (
    <Box w="100%" h="100%" bg={bg}>
      <PixelScanList
        onSelected={(p) => onDecodedPixelId(p.pixelId)}
        onClose={() => setShowScanList(false)}
      />
    </Box>
  ) : (
    <Center w="100%" h="100%" bg={bg}>
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
        <Text>{t("startingCamera")}</Text>
      )}
      {!readingColors && (
        <HStack position="absolute" top="3%" w="94%" left="3%" p="1%" bg={bg}>
          <Text flex={1} variant="comment">
            {t("resetUsingMagnet", {
              formFactor: t(getBoardOrDie(settings.formFactor)),
            })}
          </Text>
          <Button size="sm" ml="5%" onPress={() => setShowScanList(true)}>
            {t("scan")}
          </Button>
        </HStack>
      )}
      <Center position="absolute" bottom="0" w="94%" left="3" p="2" bg={bg}>
        <Text variant="comment">{getTestingMessage(t, settings)}</Text>
        <Button w="100%" onPress={onBack}>
          {t("back")}
        </Button>
      </Center>
    </Center>
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
  const [pixel, setPixel] = useState<Pixel>();
  const [cancel, setCancel] = useState(false);

  const taskChain = useTaskChain(
    cancel ? "cancel" : "run",
    ...useTaskComponent("UpdateFirmware", cancel, (p) => (
      <>
        <UpdateFirmware {...p} pixelId={pixelId} />
      </>
    ))
  ).chainWith(
    ...useTaskComponent("ConnectPixel", cancel, (p) => (
      <ConnectPixel
        {...p}
        pixelId={pixelId}
        settings={settings}
        onPixelConnected={setPixel}
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
  if (settings.formFactor !== "die") {
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
        ...useTaskComponent("WaitFaceUp", cancel, (p) => (
          <>
            {pixel && <WaitFaceUp {...p} pixel={pixel} settings={settings} />}
          </>
        ))
      )
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
            onPixelConnected={setPixel}
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
  const scrollRef = useRef<any>();
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd();
    }
  });

  return (
    <Center w="100%" h="100%" p="2%" bg={useBackgroundColor()}>
      <Text variant="comment">{getTestingMessage(t, settings)}</Text>
      <ScrollView w="100%" ref={scrollRef}>
        <>{taskChain.render()}</>
        {result && (
          <Center>
            <Text fontSize={150} textAlign="center">
              {getTaskResultEmoji(taskChain.status)}
            </Text>
            <Text mb="8%">
              {t("battery")}
              {t("colonSeparator")}
              {t("percentWithValue", { value: pixel?.batteryLevel ?? 0 })}
            </Text>
          </Center>
        )}
      </ScrollView>
      <Button w="100%" onPress={onOkCancel}>
        {result ? t("ok") : t("cancel")}
      </Button>
    </Center>
  );
}

function ValidationPage() {
  const [formFactor, setFormFactor] = useState<ValidationFormFactor>();
  const [dieType, setDieType] = useState<DieType>();
  const [pixelId, setPixelId] = useState(0);

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

function useBackgroundColor() {
  return useColorModeValue("warmGray.100", "coolGray.800");
}

function containerVariants() {
  return {
    background: {
      _dark: {
        backgroundColor: "coolGray.800",
      },
      _light: {
        backgroundColor: "warmGray.100",
      },
    },
    card: {
      rounded: "md",
      borderWidth: "2",
      _dark: {
        borderColor: "warmGray.400",
        backgroundColor: "coolGray.700",
      },
      _light: {
        borderColor: "coolGray.500",
        backgroundColor: "warmGray.200",
      },
    },
  };
}

const theme = extendTheme({
  components: {
    Box: {
      variants: containerVariants(),
    },
    Center: {
      variants: containerVariants(),
    },
    VStack: {
      variants: containerVariants(),
    },
    HStack: {
      variants: containerVariants(),
    },
    Text: {
      baseStyle: {
        fontSize: "2xl",
        fontWeight: "bold",
        _dark: {
          color: "warmGray.200",
        },
        _light: {
          color: "coolGray.700",
        },
      },
      variants: {
        comment: {
          italic: true,
          fontWeight: "1xl",
        },
      },
    },
    Button: {
      variants: {
        solid: {
          rounded: "sm",
          borderWidth: "1",
          _dark: {
            bg: "coolGray.600",
            borderColor: "coolGray.400",
            _pressed: {
              bg: "coolGray.700",
            },
            _text: {
              color: "warmGray.200",
            },
          },
          _light: {
            bg: "warmGray.300",
            borderColor: "warmGray.500",
            _pressed: {
              bg: "warmGray.200",
            },
            _text: {
              color: "coolGray.700",
            },
          },
        },
      },
      defaultProps: {
        size: "lg",
        _text: {
          fontSize: "2xl",
        },
      },
    },
  },
  config: {
    initialColorMode: "dark",
  },
});

export default function () {
  return (
    <AppPage>
      <NativeBaseProvider theme={theme} config={{ strictMode: "error" }}>
        <ValidationPage />
      </NativeBaseProvider>
    </AppPage>
  );
}
