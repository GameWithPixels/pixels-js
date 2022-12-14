import { useFocusEffect } from "@react-navigation/native";
import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import {
  AlertDialog,
  Box,
  Button,
  IBoxProps,
  Pressable,
  Text,
  VStack,
  useDisclose,
  Center,
} from "native-base";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Swipeable from "react-native-gesture-handler/Swipeable";

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
  onShowDetails: () => void;
  swipeableItemsWidth: number;
}

export default function ({
  children,
  pixelDispatcher,
  onShowDetails,
  swipeableItemsWidth,
  ...props
}: SwipeablePixelCardProps) {
  const [lastError, setLastError] = useState<Error>();
  const [profileUpdate, setProfileUpdate] = useState<number>();
  const [dfuQueued, setDfuQueued] = useState(false);
  const [dfuState, setDfuState] = useState<DfuState>("dfuCompleted");
  const [dfuProgress, setDfuProgress] = useState<number>(0);

  // Reset DFU state and progress when aborted or completed
  useEffect(() => {
    if (dfuState === "dfuAborted") {
      setDfuState("dfuCompleted");
      setDfuProgress(0);
      setLastError(new Error("DFU Aborted"));
    } else if (dfuState === "dfuCompleted") {
      setDfuProgress(0);
    }
  }, [dfuState]);

  // Subscribe to events for which we store the resulting state
  useEffect(() => {
    pixelDispatcher.addEventListener("error", setLastError);
    pixelDispatcher.addEventListener("profileUpdateProgress", setProfileUpdate);
    pixelDispatcher.addEventListener("firmwareUpdateQueued", setDfuQueued);
    pixelDispatcher.addEventListener("firmwareUpdateState", setDfuState);
    pixelDispatcher.addEventListener("firmwareUpdateProgress", setDfuProgress);
    const notifyUserListener = ({
      message,
      withCancel,
      response,
    }: {
      message: string;
      withCancel: boolean;
      response: (okCancel: boolean) => void;
    }) => {
      setNotifyUserData({
        message,
        onOk: () => response(true),
        onCancel: withCancel ? () => response(false) : undefined,
      });
    };
    pixelDispatcher.pixel.addEventListener("userMessage", notifyUserListener);
    return () => {
      pixelDispatcher.removeEventListener("error", setLastError);
      pixelDispatcher.removeEventListener(
        "profileUpdateProgress",
        setProfileUpdate
      );
      pixelDispatcher.removeEventListener("firmwareUpdateQueued", setDfuQueued);
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
  }, [pixelDispatcher]);

  // Subscribe to state change events to force updating the UI
  const [_, forceUpdate] = useReducer((b) => !b, false);
  useFocusEffect(
    useCallback(() => {
      // Re-render for every status, roll and battery event
      pixelDispatcher.addEventListener("status", forceUpdate);
      pixelDispatcher.addEventListener("rollState", forceUpdate);
      // pixelDispatcher.addEventListener("rssi", forceUpdate);
      // pixelDispatcher.addEventListener("batteryState", forceUpdate);
      return () => {
        pixelDispatcher.removeEventListener("status", forceUpdate);
        pixelDispatcher.removeEventListener("rollState", forceUpdate);
        // pixelDispatcher.removeEventListener("rssi", forceUpdate);
        // pixelDispatcher.removeEventListener("batteryState", forceUpdate);
      };
    }, [pixelDispatcher])
  );

  // Request RSSI and battery state periodically
  const isReady = pixelDispatcher.isReady;
  useFocusEffect(
    useCallback(() => {
      if (isReady) {
        const intervalId = setInterval(() => {
          pixelDispatcher.dispatch("queryRssi");
          pixelDispatcher.dispatch("queryBattery");
        }, 5000);
        return () => {
          clearInterval(intervalId);
        };
      }
    }, [isReady, pixelDispatcher])
  );

  // User notification
  const [notifyUserData, setNotifyUserData] = useState<{
    message: string;
    onOk?: () => void;
    onCancel?: () => void;
    handled?: boolean;
  }>();
  const notifyUserDisclose = useDisclose();
  const okRef = useRef(null);
  const open = notifyUserDisclose.onOpen;
  useEffect(() => {
    if (notifyUserData && !notifyUserData.handled) {
      setNotifyUserData({ ...notifyUserData, handled: true });
      open();
    }
  }, [notifyUserData, open]);

  // Refresh UI at least every 5 seconds
  useFocusEffect(() => {
    // Called on every render!
    const id = setTimeout(forceUpdate, 5000);
    return () => {
      clearTimeout(id);
    };
  });

  // Values for UI
  const { t } = useTranslation();
  const isDisco =
    !pixelDispatcher.status || pixelDispatcher.status === "disconnected";
  const lastSeen = Math.round(
    (Date.now() - pixelDispatcher.lastBleActivity.getTime()) / 1000
  );
  return (
    <Swipeable
      onSwipeableOpen={(direction, swipeable) => {
        if (direction === "left") {
          if (!dfuQueued) {
            if (isDisco) {
              pixelDispatcher.dispatch("connect");
            } else {
              pixelDispatcher.dispatch("disconnect");
            }
          }
        } else {
          if (isDisco) {
            if (pixelDispatcher.isFirmwareUpdateQueued) {
              pixelDispatcher.dispatch("dequeueFirmwareUpdate");
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
      renderLeftActions={() =>
        !dfuQueued && (
          <SwipeableItemView
            label={t(isDisco ? "connect" : "disconnect")}
            backgroundColor={isDisco ? "green.500" : "red.500"}
            _text={{ mx: sr(20), color: "gray.100", bold: true }}
          />
        )
      }
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
                  ? t("cancelFirmwareUpdate")
                  : t("updateFirmware")
                : t("blink")
            }
            backgroundColor={isDisco ? "purple.500" : "orange.500"}
            _text={{ mx: sr(20), color: "gray.100", bold: true }}
          />
        )
      }
    >
      <Pressable onPress={() => onShowDetails()}>
        <PixelInfoCard pixel={pixelDispatcher} {...props}>
          {pixelDispatcher.canUpdateFirmware && (
            <Text position="absolute" top={sr(8)} right={sr(8)}>
              ⬆️
            </Text>
          )}
          <VStack
            mb={sr(5)}
            mt={sr(-3)}
            space={sr(5)}
            alignItems="center"
            width="100%"
          >
            {/* Show either DFU progress, profile update progress, connect state or advertising state */}
            {dfuQueued ? (
              // DFU status and progress
              dfuState !== "dfuCompleted" ? (
                <Center width="100%" flexDir="row">
                  <Text>{t("firmwareUpdate")}: </Text>
                  {dfuState === "dfuStarting" && dfuProgress > 0 ? (
                    <Box flex={1}>
                      <ProgressBar percent={dfuProgress} />
                    </Box>
                  ) : (
                    <Text italic>{t(dfuState)}</Text>
                  )}
                </Center>
              ) : (
                <Text>{t("waitingOnFirmwareUpdate")}</Text>
              )
            ) : profileUpdate ? (
              // Profile update progress
              <Center width="100%" flexDir="row">
                <Text>Profile Update: </Text>
                <Box flex={1}>
                  <ProgressBar percent={profileUpdate} />
                </Box>
              </Center>
            ) : isDisco && lastSeen > 5 ? (
              // Pixel is disconnected and hasn't been seen for a while (no advertising)
              <Text italic>{`${t("unavailable")} (${
                lastSeen < 120
                  ? t("secondsWithValue", { value: lastSeen })
                  : t("minutesWithValue", { value: Math.floor(lastSeen / 60) })
              })`}</Text>
            ) : (
              // Pixel is either connecting/connected or advertising
              <Text>
                <Text>{t("status")}: </Text>
                <Text italic>
                  {t(
                    isDisco && lastSeen <= 5
                      ? "advertising"
                      : pixelDispatcher.status
                  )}
                </Text>
              </Text>
            )}
            {children}
            {lastError && (
              <>
                <Text color="red.500">{lastError?.message}</Text>
                <Button onPress={() => setLastError(undefined)}>
                  {t("clearError")}
                </Button>
              </>
            )}
          </VStack>
        </PixelInfoCard>
      </Pressable>
      <AlertDialog
        isOpen={notifyUserDisclose.isOpen}
        onClose={notifyUserDisclose.onClose}
        leastDestructiveRef={okRef}
      >
        <AlertDialog.Content>
          <AlertDialog.CloseButton />
          <AlertDialog.Header>{pixelDispatcher.name}</AlertDialog.Header>
          <AlertDialog.Body>{notifyUserData?.message}</AlertDialog.Body>
          <AlertDialog.Footer>
            <Button.Group space={2}>
              <>
                {notifyUserData?.onCancel && (
                  <Button
                    onPress={() => {
                      notifyUserData.onCancel?.();
                      notifyUserDisclose.onClose();
                    }}
                  >
                    {t("cancel")}
                  </Button>
                )}
                {notifyUserData?.onOk && (
                  <Button
                    ref={okRef}
                    onPress={() => {
                      notifyUserData.onOk?.();
                      notifyUserDisclose.onClose();
                    }}
                  >
                    {t("ok")}
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
