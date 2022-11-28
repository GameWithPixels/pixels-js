import { useFocusEffect } from "@react-navigation/native";
import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import {
  AlertDialog,
  Box,
  Button,
  IBoxProps,
  Modal,
  Pressable,
  Text,
  VStack,
  useDisclose,
  HStack,
} from "native-base";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import Swipeable from "react-native-gesture-handler/Swipeable";

import PixelDetails from "./PixelDetails";
import PixelInfoCard, { PixelInfoCardProps } from "./PixelInfoCard";
import ProgressBar from "./ProgressBar";

import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import { sr } from "~/styles";

function SwipeableItemView({
  label,
  _text,
  ...props
}: IBoxProps & { label: string }) {
  return (
    <Box justifyContent="center" alignItems="center" {...props}>
      <Text {..._text}>{label}</Text>
    </Box>
  );
}

export interface SwipeablePixelCardProps
  extends Omit<PixelInfoCardProps, "pixel"> {
  pixelDispatcher: PixelDispatcher;
  swipeableItemsWidth: number;
}

export default function ({
  children,
  pixelDispatcher,
  swipeableItemsWidth,
  ...props
}: SwipeablePixelCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [lastError, setLastError] = useState<Error>();
  const [profileUpdate, setProfileUpdate] = useState<number>();
  const [dfuQueued, setDfuQueued] = useState(false);
  const [dfuState, setDfuState] = useState<DfuState>("dfuCompleted");
  const [dfuProgress, setDfuProgress] = useState<number>(0);
  useEffect(() => {
    if (dfuState === "dfuAborted") {
      setDfuState("dfuCompleted");
      setDfuProgress(0);
      setLastError(new Error("DFU Aborted"));
    }
  }, [dfuState]);
  useEffect(() => {
    if (!showDetails) {
      const logAction = (action: string) => {
        console.log(`Dispatching ${action} on Pixel ${pixelDispatcher.name}`);
      };
      pixelDispatcher.addEventListener("action", logAction);
      pixelDispatcher.addEventListener("error", setLastError);
      pixelDispatcher.addEventListener(
        "profileUpdateProgress",
        setProfileUpdate
      );
      pixelDispatcher.addEventListener("firmwareUpdateQueued", setDfuQueued);
      pixelDispatcher.addEventListener("firmwareUpdateState", setDfuState);
      pixelDispatcher.addEventListener(
        "firmwareUpdateProgress",
        setDfuProgress
      );
      const notifyUserListener = ({
        message,
        withCancel,
        response,
      }: {
        message: string;
        withCancel: boolean;
        response: (okCancel: boolean) => void;
      }) => {
        //notifyUser(pixelDispatcher.pixel, message, withCancel, response);
        setNotifyUserData({
          message,
          onOk: () => response(true),
          onCancel: withCancel ? () => response(false) : undefined,
        });
      };
      pixelDispatcher.pixel.addEventListener("userMessage", notifyUserListener);
      return () => {
        pixelDispatcher.removeEventListener("action", logAction);
        pixelDispatcher.removeEventListener("error", setLastError);
        pixelDispatcher.removeEventListener(
          "profileUpdateProgress",
          setProfileUpdate
        );
        pixelDispatcher.removeEventListener(
          "firmwareUpdateQueued",
          setDfuQueued
        );
        pixelDispatcher.removeEventListener("firmwareUpdateState", setDfuState);
        pixelDispatcher.removeEventListener(
          "firmwareUpdateProgress",
          setDfuProgress
        );
        pixelDispatcher.pixel.removeEventListener(
          "userMessage",
          notifyUserListener
        );
      };
    }
  }, [pixelDispatcher, showDetails]);

  useFocusEffect(
    useCallback(() => {
      if (pixelDispatcher.isReady) {
        const intervalId = setInterval(() => {
          pixelDispatcher.pixel.queryBatteryState();
          pixelDispatcher.pixel.queryRssi();
        }, 5000);
        return () => {
          clearInterval(intervalId);
        };
      }
    }, [pixelDispatcher.isReady, pixelDispatcher.pixel])
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, triggerRender] = useReducer((b) => !b, false);
  // useFocusEffect(
  //   useCallback(() => {
  //     // Re-render for every status, roll and battery event
  //     pixelDispatcher.addEventListener("status", triggerRender);
  //     pixelDispatcher.addEventListener("rollState", triggerRender);
  //     pixelDispatcher.addEventListener("batteryState", triggerRender);
  //     pixelDispatcher.addEventListener("rssi", triggerRender);
  //     return () => {
  //       pixelDispatcher.removeEventListener("status", triggerRender);
  //       pixelDispatcher.removeEventListener("rollState", triggerRender);
  //       pixelDispatcher.removeEventListener("batteryState", triggerRender);
  //       pixelDispatcher.removeEventListener("rssi", triggerRender);
  //     };
  //   }, [pixelDispatcher])
  // );
  useFocusEffect(
    // Refresh UI
    useCallback(() => {
      const id = setInterval(triggerRender, 3000);
      return () => {
        clearInterval(id);
      };
    }, [])
  );

  const [notifyUserData, setNotifyUserData] = useState<{
    message: string;
    onOk?: () => void;
    onCancel?: () => void;
  }>();
  const notifyUserDisclose = useDisclose();
  const okRef = useRef(null);
  const open = notifyUserDisclose.onOpen;
  useEffect(() => {
    if (notifyUserData) {
      console.log("!!! OPEN");
      open();
    }
  }, [notifyUserData, open]);

  const isDisco =
    !pixelDispatcher.status || pixelDispatcher.status === "disconnected";
  const lastSeen = Math.round(
    (Date.now() - pixelDispatcher.lastScan.getTime()) / 1000
  );
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
          if (isDisco) {
            if (pixelDispatcher.isFirmwareUpdateQueued) {
              pixelDispatcher.dispatch("cancelFirmwareUpdate");
            } else {
              pixelDispatcher.dispatch("queueFirmwareUpdate");
            }
          } else {
            pixelDispatcher.dispatch("blink");
          }
        }
        swipeable.close();
      }}
      leftThreshold={swipeableItemsWidth}
      renderLeftActions={() => (
        <SwipeableItemView
          label={isDisco ? "Connect" : "Disconnect"}
          backgroundColor={isDisco ? "green.500" : "red.500"}
          _text={{ mx: sr(20), color: "gray.100", bold: true }}
        />
      )}
      rightThreshold={swipeableItemsWidth}
      renderRightActions={() =>
        (!isDisco ||
          (pixelDispatcher.canUpdateFirmware &&
            !pixelDispatcher.isUpdatingFirmware)) && (
          <SwipeableItemView
            width={swipeableItemsWidth}
            label={
              isDisco
                ? pixelDispatcher.isUpdatingFirmware
                  ? ""
                  : pixelDispatcher.isFirmwareUpdateQueued
                  ? "Cancel\nFirmware\nUpdate"
                  : "Update\nFirmware"
                : "Blink"
            }
            backgroundColor={isDisco ? "purple.500" : "orange.500"}
            _text={{ mx: sr(20), color: "gray.100", bold: true }}
          />
        )
      }
    >
      <Pressable onPress={() => setShowDetails(pixelDispatcher.isReady)}>
        <PixelInfoCard pixel={pixelDispatcher} {...props}>
          {pixelDispatcher.canUpdateFirmware && (
            <Text position="absolute" top={sr(8)} right={sr(8)}>
              ⬆️
            </Text>
          )}
          <VStack
            mb={sr(5)}
            p={sr(5)}
            space={sr(5)}
            alignItems="center"
            width="100%"
          >
            {dfuQueued ? (
              dfuState !== "dfuCompleted" ? (
                <HStack my={sr(10)} width="100%">
                  <Text>Firmware Update: </Text>
                  {dfuState === "dfuStarting" && dfuProgress > 0 ? (
                    <Box flex={1} my={sr(10)}>
                      <ProgressBar percent={dfuProgress} />
                    </Box>
                  ) : (
                    <Text italic>{dfuState}</Text>
                  )}
                </HStack>
              ) : (
                <Text>Waiting On Firmware Update...</Text>
              )
            ) : profileUpdate ? (
              <HStack my={sr(10)} width="100%">
                <Text>Profile Update: </Text>
                <Box flex={1} my={sr(10)}>
                  <ProgressBar percent={profileUpdate} />
                </Box>
              </HStack>
            ) : isDisco && lastSeen > 5 ? (
              <Text italic>{`Unavailable (${
                lastSeen < 120
                  ? `${lastSeen}s`
                  : `${Math.floor(lastSeen / 60)}m`
              })`}</Text>
            ) : (
              <Text>
                <Text>Status: </Text>
                <Text italic>
                  {isDisco && lastSeen <= 5
                    ? "advertising"
                    : pixelDispatcher.status}
                </Text>
              </Text>
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
            <PixelDetails pixelDispatcher={pixelDispatcher} />
          </Modal.Body>
        </Modal.Content>
      </Modal>
      <AlertDialog
        isOpen={notifyUserDisclose.isOpen}
        onClose={notifyUserDisclose.onClose}
        leastDestructiveRef={okRef}
      >
        <AlertDialog.Content>
          <AlertDialog.CloseButton />
          <AlertDialog.Header>Pixel {pixelDispatcher.name}</AlertDialog.Header>
          <AlertDialog.Body>{notifyUserData?.message}</AlertDialog.Body>
          <AlertDialog.Footer>
            <Button.Group space={2}>
              <>
                {notifyUserData?.onCancel && (
                  <Button
                    variant="unstyled"
                    colorScheme="coolGray"
                    onPress={notifyUserDisclose.onClose}
                  >
                    Cancel
                  </Button>
                )}
                {notifyUserData?.onOk && (
                  <Button
                    colorScheme="danger"
                    onPress={notifyUserDisclose.onClose}
                    ref={okRef}
                  >
                    OK
                  </Button>
                )}
              </>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </Swipeable>
  );
}
