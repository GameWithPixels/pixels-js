import {
  EditAnimationRainbow,
  EditDataSet,
} from "@systemic-games/pixels-edit-animation";
import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import { Color, Pixel } from "@systemic-games/react-native-pixels-connect";
import {
  Box,
  Button,
  IBoxProps,
  Modal,
  Pressable,
  Text,
  VStack,
} from "native-base";
import { useEffect, useState } from "react";
import Swipeable from "react-native-gesture-handler/Swipeable";

import EmojiButton from "./EmojiButton";
import PixelInfoCard, { PixelInfoCardProps } from "./PixelInfoCard";
import ProgressBar from "./ProgressBar";

import { useAppSelector } from "~/app/hooks";
import getDfuFileInfo from "~/features/dfu/getDfuFileInfo";
import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import usePixelBattery from "~/features/pixels/hooks/usePixelBattery";
import usePixelRoll from "~/features/pixels/hooks/usePixelRoll";
import usePixelRssi from "~/features/pixels/hooks/usePixelRssi";
import usePixelStatus from "~/features/pixels/hooks/usePixelStatus";
import usePixelTelemetry from "~/features/pixels/hooks/usePixelTelemetry";
import standardProfile from "~/standardProfile";
import { sr } from "~/styles";

function compareFwDates(date1?: Date, date2?: Date) {
  const time1 = date1?.getTime() ?? 0;
  const time2 = date2?.getTime() ?? 0;
  return Math.floor(time1 / 60000) !== Math.floor(time2 / 60000);
}

async function playRainbow(
  pixel: Pixel,
  onProgress?: (progress?: number) => void
) {
  onProgress?.(0);
  const editDataSet = new EditDataSet();
  editDataSet.animations.push(
    new EditAnimationRainbow({
      duration: 6,
      count: 3,
      fade: 0.5,
      traveling: true,
    })
  );
  try {
    await pixel.playTestAnimation(editDataSet.toDataSet(), onProgress);
  } finally {
    onProgress?.(undefined);
  }
}

async function updateProfile(
  pixel: Pixel,
  onProgress?: (progress?: number) => void
) {
  onProgress?.(0);
  try {
    await pixel.transferDataSet(standardProfile, onProgress);
  } finally {
    onProgress?.(undefined);
  }
}

function SwipeableItemView({ label, ...props }: IBoxProps & { label: string }) {
  return (
    <Box
      backgroundColor="gray.500"
      justifyContent="center"
      alignItems="center"
      {...props}
    >
      <Text color="gray.100">{label}</Text>
    </Box>
  );
}

function PixelDetails({ pixel }: { pixel: Pixel }) {
  const [lastError, setLastError] = useState<Error>();
  const [progress, setProgress] = useState<number>();
  const status = usePixelStatus(pixel);
  // TODO should be active by default?
  const opt = { refreshInterval: 5000, alwaysActive: true };
  const [batteryInfo] = usePixelBattery(pixel, opt);
  const [rssi] = usePixelRssi(pixel, opt);
  const [face, rollState] = usePixelRoll(pixel);
  const [telemetry] = usePixelTelemetry(pixel, opt);
  const watch = (promise: Promise<unknown>) => promise.catch(setLastError);
  const voltage = batteryInfo?.voltage.toFixed(3);
  const chargeState = batteryInfo?.isCharging ? "charging" : "not charging";
  const x = telemetry?.accX ?? 0;
  const y = telemetry?.accX ?? 0;
  const z = telemetry?.accX ?? 0;
  const acc = `${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)}`;
  return (
    <VStack space={sr(5)}>
      <Text>{`Name: ${pixel.name}, id: ${pixel.pixelId}`}</Text>
      <Text>{`LEDs count: ${pixel.ledCount}, ${pixel.designAndColor}`}</Text>
      <Text>{`Firmware: ${pixel.firmwareDate}`}</Text>
      <Text>{`Status: ${status}`}</Text>
      <Text>{`Battery: ${batteryInfo?.level}%, ${voltage}V, ${chargeState}`}</Text>
      <Text>{`RSSI: ${Math.round(rssi ?? 0)}`}</Text>
      <Text>{`Roll State: ${face}, ${rollState}`}</Text>
      <Text>{`Acceleration: ${acc}`}</Text>
      <Button onPress={() => watch(pixel.connect())}>Connect</Button>
      <Button onPress={() => watch(pixel.disconnect())}>Disconnect</Button>
      <Button onPress={() => watch(pixel.blink(Color.dimOrange))}>Blink</Button>
      <Button onPress={() => watch(playRainbow(pixel, setProgress))}>
        Rainbow
      </Button>
      {/* <Button onPress={() => watch(pixel.startCalibration())}>Calibrate</Button> */}
      <Button onPress={() => watch(updateProfile(pixel, setProgress))}>
        Reset Profile
      </Button>
      {progress !== undefined && <ProgressBar percent={100 * progress} />}
      {lastError && (
        <>
          <Text color="red.500">{`Error: ${lastError}`}</Text>
          <Button onPress={() => setLastError(undefined)}>Clear Error</Button>
        </>
      )}
    </VStack>
  );
}

export interface SwipeablePixelConnectCardProps
  extends Omit<PixelInfoCardProps, "pixel"> {
  pixelDispatcher: PixelDispatcher;
  swipeableItemsWidth: number;
}

export default function ({
  children,
  pixelDispatcher,
  swipeableItemsWidth,
  ...props
}: SwipeablePixelConnectCardProps) {
  const { dfuFiles } = useAppSelector((state) => state.dfuFiles);
  const status = usePixelStatus(pixelDispatcher.pixel);
  const [showDetails, setShowDetails] = useState(false);
  const isDisco = !status || status === "disconnected";
  const [lastError, setLastError] = useState<Error>();
  const [updateProgress, setUpdateProgress] = useState<number>();
  const [dfuState, setDfuState] = useState<DfuState>();
  useEffect(() => {
    const logAction = (action: string) => {
      console.log(`Dispatching ${action} on Pixel ${pixelDispatcher.name}`);
    };
    pixelDispatcher.addEventListener("action", logAction);
    pixelDispatcher.addEventListener("error", setLastError);
    pixelDispatcher.addEventListener(
      "profileUpdateProgress",
      setUpdateProgress
    );
    pixelDispatcher.addEventListener("firmwareUpdateState", setDfuState);
    pixelDispatcher.addEventListener(
      "firmwareUpdateProgress",
      setUpdateProgress
    );
    return () => {
      pixelDispatcher.removeEventListener("action", logAction);
      pixelDispatcher.removeEventListener("error", setLastError);
      pixelDispatcher.removeEventListener(
        "profileUpdateProgress",
        setUpdateProgress
      );
      pixelDispatcher.removeEventListener("firmwareUpdateState", setDfuState);
      pixelDispatcher.removeEventListener(
        "firmwareUpdateProgress",
        setUpdateProgress
      );
    };
  }, [pixelDispatcher]);

  return (
    <Swipeable
      onSwipeableOpen={(direction, swipeable) => {
        if (direction === "left") {
          if (isDisco) {
            pixelDispatcher.dispatch("connect");
          } else {
            pixelDispatcher.dispatch("disconnect");
          }
        } else {
          pixelDispatcher.dispatch("blink");
        }
        swipeable.close();
      }}
      leftThreshold={swipeableItemsWidth}
      renderLeftActions={() => {
        return (
          <SwipeableItemView
            width={swipeableItemsWidth}
            label={isDisco ? "Connect" : "Disconnect"}
          />
        );
      }}
      rightThreshold={swipeableItemsWidth}
      renderRightActions={() => {
        return <SwipeableItemView width={swipeableItemsWidth} label="Blink" />;
      }}
    >
      <Pressable onPress={() => setShowDetails(status === "ready")}>
        <PixelInfoCard pixel={pixelDispatcher} {...props}>
          <VStack mb={sr(5)} space={sr(5)} alignItems="center" width="100%">
            <Text>
              <Text>Status: </Text>
              <Text italic>{status}</Text>
            </Text>
            {dfuFiles.length > 0 &&
              // TODO compare rounded value
              compareFwDates(
                getDfuFileInfo(dfuFiles[0]).date,
                pixelDispatcher.firmwareDate
              ) && (
                <EmojiButton
                  ml="5%"
                  onPress={() => pixelDispatcher.dispatch("updateFirmware")}
                >
                  Update Firmware ⬆️
                </EmojiButton>
              )}
            {dfuState && (
              <Text variant="comment">{`DFU State: ${dfuState}`}</Text>
            )}
            {updateProgress !== undefined && (
              <ProgressBar percent={updateProgress} />
            )}
            {children}
            {lastError && (
              <>
                <Text color="red.500">{lastError?.message}</Text>
                <Button onPress={() => setLastError(undefined)}>
                  Clear Error
                </Button>
              </>
            )}
          </VStack>
        </PixelInfoCard>
      </Pressable>
      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        size="lg"
      >
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Die Details</Modal.Header>
          <Modal.Body>
            <PixelDetails pixel={pixelDispatcher.pixel} />
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </Swipeable>
  );
}
