import { useNavigation } from "@react-navigation/native";
import {
  Pixel,
  ScannedPixel,
} from "@systemic-games/react-native-pixels-connect";
import {
  extendTheme,
  useColorModeValue,
  NativeBaseProvider,
  Center,
  VStack,
  Text,
  Button,
  ScrollView,
} from "native-base";
import React, { useEffect, useRef, useState } from "react";
import { useErrorHandler } from "react-error-boundary";
import { useTranslation } from "react-i18next";
import {
  Camera,
  CameraPermissionStatus,
  useCameraDevices,
} from "react-native-vision-camera";

import AppPage from "~/components/AppPage";
import {
  CheckBoard,
  CheckLeds,
  ConnectPixel,
  PrepareDie,
  ShakeDevice,
  ValidationTestsSettings,
  UpdateFirmware,
  WaitFaceUp,
  WaitTurnOff,
} from "~/components/ValidationTestsComponents";
import { DieType, DieTypes } from "~/features/DieType";
import {
  getTaskResult,
  getTaskResultEmoji,
  TaskResult,
} from "~/features/tasks/TaskResult";
import useTaskChain from "~/features/tasks/useTaskChain";
import useTaskComponent from "~/features/tasks/useTaskComponent";
import usePixelIdDecoderFrameProcessor from "~/usePixelIdDecoderFrameProcessor";

function SelectFormFactorPage({
  onSelectFormFactor: onSelectRun,
}: {
  onSelectFormFactor: (run: "board" | "die") => void;
}) {
  const { t } = useTranslation();
  return (
    <VStack w="100%" h="100%" p="5" bg={useBackgroundColor()}>
      <Button h="30%" my="15%" onPress={() => onSelectRun("board")}>
        {t("validateBoard")}
      </Button>
      <Button h="30%" my="15%" onPress={() => onSelectRun("die")}>
        {t("validateDie")}
      </Button>
    </VStack>
  );
}

function SelectDieTypePage({
  onSelectDieType: onSelectType,
  onBack,
}: {
  onSelectDieType: (type: DieType) => void;
  onBack?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <VStack w="100%" h="100%" p="2" bg={useBackgroundColor()}>
      <VStack h="90%" p="2" justifyContent="center">
        {DieTypes.map((dt) => (
          <Button key={dt} my="2" onPress={() => onSelectType(dt)}>
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

  useEffect(() => {
    if (cameraPermission === "denied") {
      setCameraStatus("needPermission");
      errorHandler(new Error(t("needCameraPermission")));
    } else if (cameraPermission === "authorized" && device) {
      if (!device.supportsParallelVideoProcessing) {
        setCameraStatus("noParallelVideoProcessing");
        errorHandler(new Error(t("incompatibleCamera")));
      } else {
        setCameraStatus("ready");
      }
    }
  }, [cameraPermission, device, errorHandler, t]);

  // Frame processor for decoding PixelId
  const [frameProcessor, pixelId] = usePixelIdDecoderFrameProcessor();

  useEffect(() => {
    if (pixelId) {
      onDecodedPixelId(pixelId);
    }
  }, [onDecodedPixelId, pixelId]);

  const bg = useBackgroundColor();
  return (
    <>
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
            photo
            hdr={false}
            lowLightBoost={false}
            frameProcessor={frameProcessor}
            videoStabilizationMode="off"
            // format={format} TODO can't get camera to switch to given resolution
          />
        ) : (
          <Text>{t("startingCamera")}</Text>
        )}
        <Center position="absolute" top="0" w="94%" left="3" p="2" bg={bg}>
          <Text variant="comment">
            Reset {settings.formFactor} using magnet
          </Text>
          <Text variant="comment">and point camera at it</Text>
        </Center>
        <Center position="absolute" bottom="0" w="94%" left="3" p="2" bg={bg}>
          <Text>
            Testing {t(settings.dieType)} {settings.formFactor}
          </Text>
          <Button w="100%" onPress={onBack}>
            {t("back")}
          </Button>
        </Center>
      </Center>
    </>
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
  const [scannedPixel, setScannedPixel] = useState<ScannedPixel>();
  const [cancel, setCancel] = useState(false);
  const taskChain = useTaskChain(
    cancel ? "cancel" : "run",
    ...useTaskComponent("ConnectPixel", cancel, (p) => (
      <ConnectPixel
        {...p}
        pixelId={pixelId}
        settings={settings}
        onPixelScanned={setScannedPixel}
        onPixelConnected={setPixel}
      />
    ))
  )
    .chainWith(
      ...useTaskComponent("CheckBoard", cancel, (p) => (
        <>{pixel && <CheckBoard {...p} pixel={pixel} settings={settings} />}</>
      ))
    )
    .chainWith(
      ...useTaskComponent("ShakeDevice", cancel, (p) => (
        <>{pixel && <ShakeDevice {...p} pixel={pixel} settings={settings} />}</>
      ))
    )
    .chainWith(
      ...useTaskComponent("CheckLeds", cancel, (p) => (
        <>{pixel && <CheckLeds {...p} pixel={pixel} settings={settings} />}</>
      ))
    );
  if (settings.formFactor === "board") {
    taskChain.chainWith(
      // eslint-disable-next-line react-hooks/rules-of-hooks
      ...useTaskComponent("UpdateFirmware", cancel, (p) => (
        <>
          {scannedPixel && (
            <UpdateFirmware {...p} scannedPixel={scannedPixel} />
          )}
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
            onPixelScanned={setScannedPixel}
            onPixelConnected={setPixel}
          />
        ))
      )
      .chainWith(
        // eslint-disable-next-line react-hooks/rules-of-hooks
        ...useTaskComponent("WaitTurnOff", cancel, (p) => (
          <>
            {pixel && <WaitTurnOff {...p} pixel={pixel} settings={settings} />}
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
      <Text>{`Testing ${t(settings.dieType)} ${settings.formFactor}`}</Text>
      {/* TODO scroll view should expand */}
      <ScrollView w="100%" ref={scrollRef}>
        <>{taskChain.render()}</>
        {result && (
          <Text mb="10%" fontSize={150} textAlign="center">
            {getTaskResultEmoji(taskChain.status)}
          </Text>
        )}
      </ScrollView>
      <Button w="100%" onPress={onOkCancel}>
        {result ? t("ok") : t("cancel")}
      </Button>
    </Center>
  );
}

function ValidationPage() {
  const [formFactor, setFormFactor] = useState<"board" | "die">();
  const [dieType, setDieType] = useState<DieType>();
  const [pixelId, setPixelId] = useState(0);
  const navigation = useNavigation();

  return !formFactor ? (
    <SelectFormFactorPage
      onSelectFormFactor={setFormFactor}
      onBack={() => navigation.goBack()}
    />
  ) : !dieType ? (
    <SelectDieTypePage
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

const theme = extendTheme({
  components: {
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
          _dark: {
            bg: "coolGray.600",
            _pressed: {
              bg: "coolGray.700",
            },
            _text: {
              color: "warmGray.200",
            },
          },
          _light: {
            bg: "warmGray.300",
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
    <AppPage style={{ flex: 1 }}>
      <NativeBaseProvider theme={theme} config={{ strictMode: "error" }}>
        <ValidationPage />
      </NativeBaseProvider>
    </AppPage>
  );
}
