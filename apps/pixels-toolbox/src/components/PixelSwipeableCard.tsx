import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import {
  FastButton,
  FastHStack,
  FastVStack,
  useDisclose,
} from "@systemic-games/react-native-pixels-components";
import { ScannedPixelNotifier } from "@systemic-games/react-native-pixels-connect";
import {
  AlertDialog,
  Box,
  Button,
  IBoxProps,
  Pressable,
  Text,
} from "native-base";
import React from "react";
import { useTranslation } from "react-i18next";
import Swipeable from "react-native-gesture-handler/Swipeable";

import PixelInfoCard, { PixelInfoCardProps } from "./PixelInfoCard";
import ProgressBar from "./ProgressBar";

import PixelDispatcher from "~/features/pixels/PixelDispatcher";

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
  extends Omit<PixelInfoCardProps, "pixelInfo"> {
  scannedPixel: ScannedPixelNotifier;
  onShowDetails: () => void;
}

export default function ({
  children,
  scannedPixel,
  onShowDetails,
  ...props
}: SwipeablePixelCardProps) {
  const pixelDispatcher = PixelDispatcher.getInstance(scannedPixel);
  React.useEffect(() => {
    pixelDispatcher.dispatch("reportRssi");
  }, [pixelDispatcher]);

  const [lastError, setLastError] = React.useState<Error>();
  const [profileUpdate, setProfileUpdate] = React.useState<number>();
  const [dfuQueued, setDfuQueued] = React.useState(false);
  const [dfuState, setDfuState] = React.useState<DfuState>("dfuCompleted");
  const [dfuProgress, setDfuProgress] = React.useState<number>(0);

  // Reset DFU state and progress when aborted or completed
  React.useEffect(() => {
    if (dfuState === "dfuAborted") {
      setDfuState("dfuCompleted");
      setDfuProgress(0);
      setLastError(new Error("DFU Aborted"));
    } else if (dfuState === "dfuCompleted") {
      setDfuProgress(0);
    }
  }, [dfuState]);

  // Subscribe to events for which we store the resulting state
  React.useEffect(() => {
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

  // User notification
  const [notifyUserData, setNotifyUserData] = React.useState<{
    message: string;
    onOk?: () => void;
    onCancel?: () => void;
    handled?: boolean;
  }>();
  const notifyUserDisclose = useDisclose();
  const okRef = React.useRef(null);
  const open = notifyUserDisclose.onOpen;
  React.useEffect(() => {
    if (notifyUserData && !notifyUserData.handled) {
      setNotifyUserData({ ...notifyUserData, handled: true });
      open();
    }
  }, [notifyUserData, open]);

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
      renderLeftActions={() =>
        !dfuQueued && (
          <SwipeableItemView
            px={1}
            label={t(isDisco ? "connect" : "disconnect")}
            backgroundColor={isDisco ? "green.500" : "red.500"}
            _text={{ mx: 5, color: "gray.100", bold: true }}
          />
        )
      }
      renderRightActions={() =>
        (!isDisco ||
          (pixelDispatcher.canUpdateFirmware &&
            !pixelDispatcher.isUpdatingFirmware)) && (
          <SwipeableItemView
            px={1}
            label={
              isDisco
                ? pixelDispatcher.isUpdatingFirmware
                  ? ""
                  : pixelDispatcher.isFirmwareUpdateQueued
                  ? t("cancelFirmwareUpdate")
                  : t("updateFirmware").replace(" ", "\n")
                : t("blink")
            }
            backgroundColor={isDisco ? "purple.500" : "orange.500"}
            _text={{ mx: 5, color: "gray.100", bold: true }}
          />
        )
      }
    >
      <Pressable onPress={() => onShowDetails()}>
        <PixelInfoCard pixelInfo={pixelDispatcher} {...props}>
          {pixelDispatcher.canUpdateFirmware && (
            <Text position="absolute" top={1} right={2}>
              ⬆️
            </Text>
          )}
          <FastVStack mt={-1} alignItems="center" width="100%">
            {/* Show either DFU progress, profile update progress, connect state or advertising state */}
            {dfuQueued ? (
              // DFU status and progress
              dfuState !== "dfuCompleted" ? (
                <FastHStack
                  width="100%"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text>{t("firmwareUpdate")}: </Text>
                  {dfuState === "dfuStarting" && dfuProgress > 0 ? (
                    <Box flex={1}>
                      <ProgressBar percent={dfuProgress} />
                    </Box>
                  ) : (
                    <Text italic>{t(dfuState)}</Text>
                  )}
                </FastHStack>
              ) : (
                <Text>{t("waitingOnFirmwareUpdate")}</Text>
              )
            ) : profileUpdate ? (
              // Profile update progress
              <FastHStack
                width="100%"
                alignItems="center"
                justifyContent="center"
              >
                <Text>Profile Update: </Text>
                <Box flex={1}>
                  <ProgressBar percent={profileUpdate} />
                </Box>
              </FastHStack>
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
                <FastButton onPress={() => setLastError(undefined)}>
                  {t("clearError")}
                </FastButton>
              </>
            )}
          </FastVStack>
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
